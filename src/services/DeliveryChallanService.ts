import { EntityManager, Repository } from 'typeorm';

import { DeliveryChallan } from '../entity/DeliveryChallan';
import { DeliveryChallanItem } from '../entity/DeliveryChallanItem';
import { SalesOrder } from '../entity/SalesOrder';
import { SalesOrderItem } from '../entity/SalesOrderItem';
import { AppDataSource } from '../../data-source';

interface CreateChallanDto {
    tenantId: number;
    dcNumber: string;
    salesOrderId: number;
    customerId: number;
    vehicleNumber?: string | null;
    transporterName?: string | null;
    dispatchDate?: string | Date;
    items: Array<{
        salesOrderItemId: number;
        productId: number;
        quantityShipped: number;
    }>;
}

export class DeliveryChallanService {
    private dcRepository!: Repository<DeliveryChallan>;

    async init(dcRepo: Repository<DeliveryChallan>): Promise<void> {
        this.dcRepository = dcRepo;
        console.log("DeliveryChallanService repository initialized.");
    }

    /**
     * Retrieves all Delivery Challans for a specific tenant
     */
    async getChallans(tenantId: number): Promise<DeliveryChallan[]> {
        return await this.dcRepository.find({
            where: { tenantId },
            relations: ['items', 'items.product']
        });
    }

    /**
     * Creates a Delivery Challan with full transaction & over-shipment validation
     */
    async createDeliveryChallan(createDto: CreateChallanDto, manager?: EntityManager) {
        console.log('createChallanDto:', createDto);

        const queryRunner = manager ? manager.queryRunner : AppDataSource.createQueryRunner();
        let shouldReleaseQueryRunner = false;

        try {
            if (!manager) {
                await queryRunner!.connect();
                await queryRunner!.startTransaction();
                shouldReleaseQueryRunner = true;
            }

            const activeManager = queryRunner!.manager;
            const dcRepo = activeManager.getRepository(DeliveryChallan);
            const soItemRepo = activeManager.getRepository(SalesOrderItem);
            const dcItemRepo = activeManager.getRepository(DeliveryChallanItem);

            // 1. Enforce unique check for dcNumber per tenant
            const existingDc = await dcRepo.findOne({ 
                where: { tenantId: createDto.tenantId, dcNumber: createDto.dcNumber } 
            });
            if (existingDc) {
                throw new Error(`Delivery Challan number ${createDto.dcNumber} already exists.`);
            }

            // 2. Aggregate previously shipped quantities for this Sales Order
            const historicallyShipped = await dcItemRepo.createQueryBuilder('dci')
                .innerJoin('dci.deliveryChallan', 'dc')
                .select('dci.sales_order_item_id', 'soItemId')
                .addSelect('SUM(dci.quantityShipped)', 'totalShipped')
                .where('dc.sales_order_id = :soId', { soId: createDto.salesOrderId })
                .groupBy('dci.sales_order_item_id')
                .getRawMany();

            const shippedMap = new Map<number, number>(
                historicallyShipped.map(h => [Number(h.soItemId), Number(h.totalShipped)])
            );

            // 3. Fetch original ordered quantities
            const originalSoItems = await soItemRepo.find({
                where: { salesOrderId: createDto.salesOrderId }
            });
            const orderedMap = new Map<number, number>(
                originalSoItems.map(item => [item.id, item.quantity])
            );

            // 4. Map and validate quantities
            const challanItemsToCreate = createDto.items.map(item => {
                const totalOrdered = orderedMap.get(item.salesOrderItemId) || 0;
                const totalShippedSoFar = shippedMap.get(item.salesOrderItemId) || 0;
                const remainingToShip = totalOrdered - totalShippedSoFar;

                if (totalOrdered === 0) {
                    throw new Error(`Item reference ID ${item.salesOrderItemId} does not belong to Sales Order ${createDto.salesOrderId}.`);
                }

                if (item.quantityShipped > remainingToShip) {
                    throw new Error(`Over-shipment validation failed. Item ID ${item.salesOrderItemId} has ${remainingToShip} units remaining, but trying to dispatch ${item.quantityShipped}.`);
                }

                // Construct individual TypeORM item entities
                const challanItem = new DeliveryChallanItem();
                challanItem.salesOrderItemId = item.salesOrderItemId;
                challanItem.productId = item.productId;
                challanItem.quantityShipped = item.quantityShipped;
                return challanItem;
            });

            // 5. Build and Save the Challan Document
            const newChallan = dcRepo.create({
                tenantId: createDto.tenantId,
                dcNumber: createDto.dcNumber,
                salesOrderId: createDto.salesOrderId,
                customerId: createDto.customerId,
                vehicleNumber: createDto.vehicleNumber || null,
                transporterName: createDto.transporterName || null,
                dispatchDate: createDto.dispatchDate ? new Date(createDto.dispatchDate) : new Date(),
                items: challanItemsToCreate
            });

            const savedChallan = await dcRepo.save(newChallan);
console.log('savedChallan:',savedChallan);

            if (shouldReleaseQueryRunner) {
                await queryRunner!.commitTransaction();
            }

            return savedChallan;

        } catch (error) {
            if (shouldReleaseQueryRunner) {
                await queryRunner!.rollbackTransaction();
            }
            throw error;
        } finally {
            if (shouldReleaseQueryRunner) {
                await queryRunner!.release();
            }
        }
    }
}
