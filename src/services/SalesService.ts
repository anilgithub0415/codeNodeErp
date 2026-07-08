import { EntityManager, Not, Repository } from 'typeorm';
import { AppDataSource } from '../../data-source'; 
import { SalesOrder } from '../entity/SalesOrder';
import { SalesOrderItem } from '../entity/SalesOrderItem';
import { Product } from '../entity/Product';
import { DocumentSequence } from '../entity/DocumentSequence';
import { Customer } from '../entity/Customer';
import { Site } from '../entity/Site';
import { CustomerCategory } from '../entity/CustomerCategory';
import { CustomerCategoryMapping } from '../entity/CustomerCategoryMapping';
import { ProductVariant } from '../entity/productVariant';
import { ProductUomConversion } from '../entity/ProductUomConversion';
import { getProductRepository, getProductUomConversionRepository, getProductVariantRepository } from '../dependencies';

interface CreateSalesOrderDto {
    tenantId: number;
    soNumber: string;
    customerId: number; 
    siteId?: number;
    createdByUserId?: number;
    items: any[];
    [key: string]: any;
}

export interface CreatedSalesOrderResponse {
    salesOrder: SalesOrder;
}

export class SalesService {
    private salesRepository!: Repository<SalesOrder>;

    async init(salesRepo: Repository<SalesOrder>): Promise<void> {
        this.salesRepository = salesRepo;
        console.log("SalesService repository initialized.");       
    }

    async createSalesOrder(
        createDto: CreateSalesOrderDto,
        manager?: EntityManager
    ): Promise<CreatedSalesOrderResponse> {
        console.log('createDto at first..............', createDto);

        const isExternalTransaction = !!manager;
        const txManager = isExternalTransaction ? manager! : AppDataSource.manager;
        let queryRunner: any = null;

        try {
            if (!isExternalTransaction) {
                queryRunner = AppDataSource.createQueryRunner();
                await queryRunner.connect();
                await queryRunner.startTransaction();
            }

            const activeManager = isExternalTransaction ? txManager : queryRunner.manager;

            const salesRepo = activeManager.getRepository(SalesOrder);
            const custRepo = activeManager.getRepository(Customer);
            const mappingRepo = activeManager.getRepository(CustomerCategoryMapping);            
            const poiRepo = activeManager.getRepository(SalesOrderItem);
            const productRepo = activeManager.getRepository(Product);
            const variantRepo = activeManager.getRepository(ProductVariant);

            const orgProfile = await custRepo.findOne({
                where: { id: createDto.customerId },
                relations: ['customerCategory']
            });

            if (!orgProfile) {
                throw new Error(`Customer with ID ${createDto.customerId} does not exist.`);
            }

            const categoryName = orgProfile.customerCategory?.customerCategory; 
            let computedChannelCode = "W"; 

            if (categoryName) {
                const mapping = await mappingRepo.findOne({
                    where: { tenantId: createDto.tenantId, categoryName: categoryName }
                });
                if (mapping) computedChannelCode = mapping.channelCode;
            }

            let targetOrder: SalesOrder;
            console.log('checking existingSales for soNumber:', createDto.soNumber);

            let existingSales = await salesRepo.findOne({ 
                where: { 
                    tenantId: createDto.tenantId, 
                    soNumber: createDto.soNumber 
                } 
            });
            if (createDto.soNumber === '') { existingSales = null; }

            const enrichedItems: SalesOrderItem[] = [];

            for (const itemInput of (createDto.items || [])) {
                const orderItem = poiRepo.create();
                orderItem.quantity = Number(itemInput.quantity || 0);
                
                let extractedPrice = 0.00;
                let chosenUom = itemInput.salesUom?.trim();

                if (itemInput.productId && !itemInput.productVariantId) {
                    const product = await productRepo.findOne({ 
                        where: { id: itemInput.productId, tenantId: createDto.tenantId } 
                    });
                    if (!product) throw new Error(`Product ID ${itemInput.productId} not found.`);

                    if (!chosenUom) {
                        chosenUom = product.defaultSalesUom || product.baseUom;
                    }

                    extractedPrice = categoryName && product.customAttributes?.tier_prices?.[categoryName]
                        ? Number(product.customAttributes.tier_prices[categoryName])
                        : Number(product.basePrice || 0.00);

                    orderItem.productId = product.id;
                    orderItem.productVariantId = null; 
                    orderItem.prodName = product.prodName;
                    orderItem.sku = product.sku;
                    orderItem.customAttributes = itemInput.customAttributes || null;
                    orderItem.salesUom = chosenUom; 

                } else if (itemInput.productVariantId && !itemInput.productId) {
                    const variant = await variantRepo.findOne({
                        where: { id: itemInput.productVariantId },
                        relations: ['productTemplate']
                    });
                    if (!variant || variant.productTemplate.tenantId !== createDto.tenantId) {
                        throw new Error(`Variant ID ${itemInput.productVariantId} not found.`);
                    }

                    if (!chosenUom) {
                        chosenUom = variant.productTemplate.defaultSalesUom || variant.productTemplate.baseUom;
                    }

                    extractedPrice = categoryName && variant.customAttributes?.tier_prices?.[categoryName]
                        ? Number(variant.customAttributes.tier_prices[categoryName])
                        : Number(variant.basePrice || 0.00);

                    orderItem.productId = null;
                    orderItem.productVariantId = variant.id;
                    
                    const sizeStr = variant.size ? ` (${variant.size})` : '';
                    const finishStr = variant.finish ? ` - ${variant.finish}` : '';
                    orderItem.prodName = `${variant.productTemplate.prodName}${sizeStr}${finishStr}`;
                    orderItem.sku = variant.sku;
                    orderItem.customAttributes = itemInput.customAttributes || null;
                    orderItem.salesUom = chosenUom;

                } else {
                    throw new Error("Invalid item format. Provide exactly one: productId OR productVariantId.");
                }

                orderItem.finalPrice = Number(itemInput.finalPrice || itemInput.unitPrice || itemInput.price || extractedPrice || 0.00);
                enrichedItems.push(orderItem);
            }

            if (existingSales) {
                console.log(`Found existing Sales Order: ${existingSales.soNumber}, performing update.`);
                
                const oldItems = await poiRepo.find({ where: { salesOrderId: existingSales.id } });
                await poiRepo.delete({ salesOrderId: existingSales.id });

                const { soNumber, customerId, ...updateData } = createDto;
                salesRepo.merge(existingSales, { ...updateData, clientId: createDto.customerId });  

                for (const item of enrichedItems) {
                    item.salesOrderId = existingSales.id;
                    item.salesOrder = existingSales;
                }
                existingSales.items = enrichedItems;
                targetOrder = await salesRepo.save(existingSales);

                await this.adjustStockDeltaOnUpdate(activeManager, createDto.tenantId, oldItems, enrichedItems);

          } else {
    console.log(`Creating fresh Sales Order. Provided No: ${createDto.soNumber || 'Will Auto-Generate'}`);
    
    console.log('Generating autonumbering...');
    const generatedSONumber = await this.generateSalesOrderNumber(activeManager, computedChannelCode);
    createDto.soNumber = generatedSONumber;

    // 🌟 FIX: Retain explicit type-safe primitives that map directly to the entity columns
    const cleanCreatePayload = {
        tenantId: createDto.tenantId,
        soNumber: createDto.soNumber,
        clientId: Number(createDto.clientId), // Force raw primitive assignment matching @Column() clientId
        siteId: createDto.siteId ? Number(createDto.siteId) : null,
        status: createDto.status || 'DRAFT',
        subTotal: Number(createDto.subTotal || 0),
        taxAmount: Number(createDto.taxAmount || 0),
        shippingAmount: Number(createDto.shippingAmount || 0),
        totalAmount: Number(createDto.totalAmount || 0),
        customAttributes: createDto.customAttributes || null
    };

    console.log('TypeORM creation mapping context target profile:', cleanCreatePayload);

    const newOrder = salesRepo.create(cleanCreatePayload);
    newOrder.items = enrichedItems;

    // Save parent first to establish a valid identity key index context 
    targetOrder = await salesRepo.save(newOrder);

    // Explicitly set relationship identifiers on new creation items
    for (const item of enrichedItems) {
        item.salesOrderId = targetOrder.id;
        item.salesOrder = targetOrder;
    }

    // Save line items through child repository directly to bypass parent cascade checks
    await poiRepo.save(enrichedItems);
    targetOrder.items = enrichedItems;

    // Decrement product inventory safely
    await this.decrementProductStock(activeManager, createDto.tenantId, enrichedItems);
}

            if (!isExternalTransaction && queryRunner) {
                await queryRunner.commitTransaction();
            }

            if (targetOrder && targetOrder.items) {
                for (const item of targetOrder.items) {
                    delete (item as any).salesOrder;
                }
            }

            return { salesOrder: targetOrder };

        } catch (error) {
            if (!isExternalTransaction && queryRunner) await queryRunner.rollbackTransaction();
            console.error('Error in createSalesOrder:', error);
            throw error;
        } finally {
            if (!isExternalTransaction && queryRunner) await queryRunner.release();
        }
    }
    private async adjustStockDeltaOnUpdate(
        txManager: EntityManager,
        tenantId: number,
        oldItems: SalesOrderItem[],
        newItems: SalesOrderItem[]
    ): Promise<void> {
        const productRepo = txManager.getRepository(Product);
        const variantRepo = txManager.getRepository(ProductVariant);
        
        const oldItemsMap = new Map<string, number>();
        const processedCompositeKeys = new Set<string>();

        const buildItemKey = (pId: number | null, vId: number | null, uom: string) => 
            `${pId || 0}_${vId || 0}_${uom.toLowerCase().trim()}`;

        for (const item of oldItems) {
            const pid = item.productId ? Number(item.productId) : null;
            const vid = item.productVariantId ? Number(item.productVariantId) : null;
            const oldQty = Number(item.quantity || 0);
            if ((!pid && !vid) || oldQty === 0) continue;

            let inventoryTrackingUom = 'PCS';
            if (pid) {
                const prod = await productRepo.findOne({ where: { id: pid }, select: ['baseUom'] });
                if (prod) inventoryTrackingUom = prod.baseUom;
            } else if (vid) {
                const variant = await variantRepo.findOne({ where: { id: vid }, select: ['baseUom'] });
                if (variant) inventoryTrackingUom = variant.baseUom;
            }

            let factor = 1.0000;
            const incomingOldUom = item.salesUom || inventoryTrackingUom;

            if (incomingOldUom.toLowerCase() !== inventoryTrackingUom.toLowerCase()) {
                factor = await this.getConversionFactor(txManager, tenantId, pid, vid, incomingOldUom);
            }

            const oldBaseQty = oldQty * factor;
            const key = buildItemKey(pid, vid, incomingOldUom);
            oldItemsMap.set(key, (oldItemsMap.get(key) || 0) + oldBaseQty);
        }

        for (const it of newItems) {
            const pid = it.productId ? Number(it.productId) : null;
            const vid = it.productVariantId ? Number(it.productVariantId) : null;
            const newQty = Number(it.quantity || 0);
            if ((!pid && !vid) || newQty === 0) continue;

            let inventoryTrackingUom = 'PCS';
            if (pid) {
                const prod = await productRepo.findOne({ where: { id: pid }, select: ['baseUom'] });
                if (prod) inventoryTrackingUom = prod.baseUom;
            } else if (vid) {
                const variant = await variantRepo.findOne({ where: { id: vid }, select: ['baseUom'] });
                if (variant) inventoryTrackingUom = variant.baseUom;
            }

            let factor = 1.0000;
            const incomingNewUom = it.salesUom || inventoryTrackingUom;

            if (incomingNewUom.toLowerCase() !== inventoryTrackingUom.toLowerCase()) {
                factor = await this.getConversionFactor(txManager, tenantId, pid, vid, incomingNewUom);
            }

            const newBaseQty = newQty * factor;
            const currentKey = buildItemKey(pid, vid, incomingNewUom);
            processedCompositeKeys.add(currentKey);

            const oldBaseQty = oldItemsMap.get(currentKey) || 0; 
            const delta = newBaseQty - oldBaseQty; 
            
            if (delta === 0) continue; 

            const targetRepo = vid ? variantRepo : productRepo;
            const targetId = vid ? vid : pid;

            if (delta > 0) {
                console.log(`Sales Update [ID: ${targetId}]: Quantity increased. Deducting -${delta} ${inventoryTrackingUom} from stock.`);
                await targetRepo.decrement({ id: targetId! }, 'currentstock', delta);
            } else {
                console.log(`Sales Update [ID: ${targetId}]: Quantity decreased. Returning +${Math.abs(delta)} ${inventoryTrackingUom} to stock.`);
                await targetRepo.increment({ id: targetId! }, 'currentstock', Math.abs(delta));
            }
        }

        for (const oldItem of oldItems) {
            const pid = oldItem.productId ? Number(oldItem.productId) : null;
            const vid = oldItem.productVariantId ? Number(oldItem.productVariantId) : null;
            const incomingOldUom = oldItem.salesUom || 'PCS';
            const oldKey = buildItemKey(pid, vid, incomingOldUom);
            
            if (!processedCompositeKeys.has(oldKey)) {
                const refundBaseQty = oldItemsMap.get(oldKey) || 0;
                if (refundBaseQty <= 0) continue;

                console.log(`Sales Line Removed: Returning full historical allocation of +${refundBaseQty} base units back to stock.`);
                const targetRepo = vid ? variantRepo : productRepo;
                const targetId = vid ? vid : pid;

                await targetRepo.increment({ id: targetId! }, 'currentstock', refundBaseQty);
            }
        }
    }

    private async decrementProductStock(
        txManager: EntityManager,
        tenantId: number,
        items: SalesOrderItem[]
    ): Promise<void> {
        const productRepo = txManager.getRepository(Product);
        const variantRepo = txManager.getRepository(ProductVariant);

        const sortedItems = [...items].sort((a, b) => {
            const idA = a.productVariantId ? Number(a.productVariantId) : (a.productId ? Number(a.productId) : 0);
            const idB = b.productVariantId ? Number(b.productVariantId) : (b.productId ? Number(b.productId) : 0);
            return idA - idB; 
        });

        for (const it of sortedItems) {
            const pid = it.productId ? Number(it.productId) : null;
            const vid = it.productVariantId ? Number(it.productVariantId) : null;
            const saleQty = Number(it.quantity || 0);
            
            if ((!pid && !vid) || saleQty === 0) continue;

            let inventoryTrackingUom = 'PCS'; 
            let repoToUpdate: typeof productRepo | typeof variantRepo;
            let lookupCriteria: { id: number };
            let currentStockAvailable = 0;

            if (pid) {
                const product = await productRepo.findOne({ 
                    where: { id: pid }, 
                    select: ['id', 'baseUom', 'currentstock'],
                    lock: { mode: "pessimistic_write" } 
                });
                if (!product) throw new Error(`Product ID ${pid} not found.`);
                
                inventoryTrackingUom = product.baseUom;
                currentStockAvailable = Number(product.currentstock || 0);
                repoToUpdate = productRepo;
                lookupCriteria = { id: pid };
            } else if (vid) {
                const variant = await variantRepo.findOne({ 
                    where: { id: vid }, 
                    select: ['id', 'baseUom', 'currentstock'],
                    lock: { mode: "pessimistic_write" } 
                });
                if (!variant) throw new Error(`Variant ID ${vid} not found.`);
                
                inventoryTrackingUom = variant.baseUom;
                currentStockAvailable = Number(variant.currentstock || 0);
                repoToUpdate = variantRepo;
                lookupCriteria = { id: vid };
            } else {
                continue;
            }

            let factor = 1.0000;
            const incomingSaleUom = it.salesUom || inventoryTrackingUom;

            if (incomingSaleUom.toLowerCase() !== inventoryTrackingUom.toLowerCase()) {
                factor = await this.getConversionFactor(txManager, tenantId, pid, vid, incomingSaleUom);
            }

            const targetStockQty = saleQty * factor;

            if (currentStockAvailable < targetStockQty) {
                throw new Error(
                    `Insufficient Stock for Item ID ${lookupCriteria.id}. Requested: ${targetStockQty}, Available: ${currentStockAvailable}`
                );
            }

            console.log(`Decrementing Stock [ID: ${lookupCriteria.id}]: Subtracting -${targetStockQty}`);
            await repoToUpdate.decrement(lookupCriteria, 'currentstock', targetStockQty);
        }
    }

    private async getConversionFactor(
        txManager: EntityManager,
        tenantId: number,
        productId: number | null,
        productVariantId: number | null,
        purchaseOrSaleUom: string
    ): Promise<number> {
        const conversionRepo = txManager.getRepository(ProductUomConversion);

        const queryBuilder = conversionRepo.createQueryBuilder('conversion')
            .where('conversion.tenantId = :tenantId', { tenantId })
            .andWhere('(LOWER(conversion.purchaseUom) = LOWER(:uom) OR LOWER(conversion.saleUom) = LOWER(:uom))', { uom: purchaseOrSaleUom });

        if (productId) {
            queryBuilder.andWhere('conversion.productId = :productId', { productId });
        } else if (productVariantId) {
            queryBuilder.andWhere('conversion.productVariantId = :productVariantId', { productVariantId });
        } else {
            return 1.0000; 
        }

        const rule = await queryBuilder.getOne();
        if (!rule) return 1.0000;

        return Number(rule.conversionFactor);
    }

    async getSO(tenantId: number, SOid: number, manager?: EntityManager): Promise<SalesOrder[]> {
        if (!this.salesRepository) throw new Error('SalesService repository not initialized.');
        const repo = manager ? manager.getRepository(SalesOrder) : this.salesRepository;
        return await repo.find({ where: { tenantId, id: SOid }, relations: { items: true } });
    }

    async getSOs(tenantId: number, manager?: EntityManager): Promise<SalesOrder[]> {
        if (!this.salesRepository) throw new Error('SalesService repository not initialized.');
        const repo = manager ? manager.getRepository(SalesOrder) : this.salesRepository;
        return await repo.find({ where: { tenantId }, relations: { items: true } });
    }

    public async generateSalesOrderNumber(
        transactionalEntityManager: EntityManager, 
        channelCode: string = "W"
    ): Promise<string> {
        const now = new Date();
        const yearMonth = `${now.getFullYear().toString().slice(-2)}${(now.getMonth() + 1).toString().padStart(2, '0')}`;
        const docType = "SALES_ORDER";

        let sequence = await transactionalEntityManager
            .getRepository(DocumentSequence)
            .createQueryBuilder("seq")
            .setLock("pessimistic_write") 
            .where("seq.documentType = :docType AND seq.prefixYearMonth = :yearMonth", { docType, yearMonth })
            .getOne();

        let nextValue: number;

        if (!sequence) {
            nextValue = 100001;
            const newSequence = new DocumentSequence();
            newSequence.documentType = docType;
            newSequence.prefixYearMonth = yearMonth;
            newSequence.currentValue = nextValue;
            await transactionalEntityManager.save(DocumentSequence, newSequence);
        } else {
            nextValue = sequence.currentValue + 1;
            sequence.currentValue = nextValue;
            await transactionalEntityManager.save(DocumentSequence, sequence);
        }
        return `SO-${yearMonth}-${channelCode.toUpperCase()}-${nextValue}`;
    }

    async fetchTenantSalesRulesMatrix(
        tenantId: number, 
        productId: number | null, 
        productVariantId: number | null
    ): Promise<any> {
        let activeBaseUom = 'PCS'; 
        let conversionRules: ProductUomConversion[] = [];

        if (productVariantId) {
            conversionRules = await getProductUomConversionRepository()
                .getProductUomConversion(tenantId, null, productVariantId);
            const variantRecord = await getProductVariantRepository()
                .getProductVariant(tenantId, productVariantId!);
            if (variantRecord?.productTemplate) {
                activeBaseUom = variantRecord.productTemplate.baseUom;
            }
        } else if (productId) {
            conversionRules = await getProductUomConversionRepository()
                .getProductUomConversion(tenantId, productId, null);
            const productRecord = await getProductRepository()
                .getProduct(tenantId, productId);
            if (productRecord) {
                activeBaseUom = productRecord.baseUom;
            }
        }

        const structuredUnits = conversionRules.map(rule => ({
            label: `${rule.saleUom} (x${Number(rule.conversionFactor).toFixed(2)})`,
            value: rule.saleUom,
            factor: Number(rule.conversionFactor),
            sourcePurchaseUom: rule.purchaseUom 
        }));

        const uniqueSalesUnits = structuredUnits.filter((unit, index, self) =>
            index === self.findIndex((u) => u.value.toLowerCase() === unit.value.toLowerCase())
        );

        if (!uniqueSalesUnits.some(u => u.value.toLowerCase() === activeBaseUom.toLowerCase())) {
            uniqueSalesUnits.unshift({
                label: `${activeBaseUom} (Baseline)`,
                value: activeBaseUom,
                factor: 1.0000,
                sourcePurchaseUom: activeBaseUom
            });
        }

        return { 
            baseInventoryUom: activeBaseUom, 
            availableSalesUnits: uniqueSalesUnits 
        };
    }
}

export default SalesService;
