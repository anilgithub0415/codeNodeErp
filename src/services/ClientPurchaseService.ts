import { EntityManager, Repository } from 'typeorm';
import { AppDataSource } from '../../data-source'; 
import { ClientPurchaseOrder, POStatus } from '../entity/ClientPurchaseOrder';
import { ClientPurchaseOrderItem } from '../entity/ClientPurchaseOrderItem';
import { Product } from '../entity/Product';
import { ProductVariant } from '../entity/productVariant';
import { DocumentSequence } from '../entity/DocumentSequence';

interface CreateClientPoDto {
    id?:number;
    tenantId: number;
    clientId: number;
    siteId: number | null;
    clientPoNumber:string;
    status: string;
    clientNotes?: string;
    requestedDeliveryDate?: Date | null;
    items: Array<{
        productId: number | null;
        productVariantId: number | null;
        quantity: number;
        purchaseUom: string | null;
    }>;
}

export class ClientPurchaseOrderService {
    private clientPoRepo!: Repository<ClientPurchaseOrder>;

    async init(repo: Repository<ClientPurchaseOrder>): Promise<void> {
        this.clientPoRepo = repo;
        console.log("ClientPurchaseOrderService backend layer initialized successfully.");
    }

        /* ---------------------------------------------------------
       GET SINGLE CLIENT PO FOR TENANT & ID – Aligned for Client Orders
       --------------------------------------------------------- */
    async getClientPO(
        tenantId: number,
        cpoId: number,
        manager?: EntityManager
    ): Promise<ClientPurchaseOrder[]> {
        if (!this.clientPoRepo) {
            throw new Error(
                'ClientPurchaseOrderService repository not initialized. Call init() first.'
            );
        }

        const repo = manager
            ? manager.getRepository(ClientPurchaseOrder)
            : this.clientPoRepo;

        // Fetches a specific tracking record isolated securely within the tenant space
        const orders = await repo.find({ 
            where: { tenantId, id: cpoId }, 
            relations: { items: true } 
        });
      
        return orders;
    }

        /* ---------------------------------------------------------
       GET CLIENT PO LIST FOR TENANT, SITE, & OPTIONAL CLIENT ID
       --------------------------------------------------------- */
        /* ---------------------------------------------------------
       GET CLIENT PO LIST FOR TENANT, SITE, & OPTIONAL CLIENT ID
       --------------------------------------------------------- */
    async getClientPOsFiltered(
        tenantId: number,
        siteId?: number,
        clientId?: number,
        manager?: EntityManager
    ): Promise<ClientPurchaseOrder[]> {
        if (!this.clientPoRepo) {
            throw new Error('ClientPurchaseOrderService repository not initialized.');
        }

        console.log('Filtering Client Purchase Orders for Tenant:', tenantId, ' Site:', siteId, ' Client:', clientId);

        const repo = manager ? manager.getRepository(ClientPurchaseOrder) : this.clientPoRepo;

        // 1. Initialize the TypeORM conditional query block matching primary tenant indexes
        const whereConditions: any = { tenantId };

        // 2. Map structural query target arguments securely
        // Matches your entity declaration line: siteId!: number | null;
        if (siteId !== undefined && siteId !== null && !isNaN(siteId)) {
            whereConditions.siteId = siteId;
        }

        // Matches your entity declaration line: clientId!: number;
        if (clientId !== undefined && clientId !== null && !isNaN(clientId)) {
            whereConditions.clientId = clientId;
        }

        // 3. Execute find operation tracking nested line item sub-tables
        return await repo.find({
            where: whereConditions,
            relations: { items: true },
            order: { id: 'DESC' } // Most recent purchase rows render on top of grid matrix layouts
        });
    }


    /* ---------------------------------------------------------
       GET ALL CLIENT POs FOR TENANT – Aligned for Client Orders
       --------------------------------------------------------- */
    async getClientPOs(
        tenantId: number,
        manager?: EntityManager
    ): Promise<ClientPurchaseOrder[]> {
        if (!this.clientPoRepo) {
            throw new Error(
                'ClientPurchaseOrderService repository not initialized. Call init() first.'
            );
        }

        const repo = manager
            ? manager.getRepository(ClientPurchaseOrder)
            : this.clientPoRepo;

        // Extracts all requisitions under the active multi-tenant workspace context safely
        const orders = await repo.find({ 
            where: { tenantId }, 
            relations: { items: true } 
        });
      
        return orders;
    }

    /**
     * Records bare material tracking entries without altering live inventory balances.
     */
    async createClientPurchaseOrder(
    dto: CreateClientPoDto,
    manager?: EntityManager
): Promise<ClientPurchaseOrder> {
    const isExternalTx = !!manager;
    const txManager = isExternalTx ? manager! : AppDataSource.manager;
    let queryRunner: any = null;

    try {
        if (!isExternalTx) {
            queryRunner = AppDataSource.createQueryRunner();
            await queryRunner.connect();
            await queryRunner.startTransaction();
        }

        const activeManager = isExternalTx ? txManager : queryRunner.manager;

        const cpoRepo = activeManager.getRepository(ClientPurchaseOrder);
        const cpoiRepo = activeManager.getRepository(ClientPurchaseOrderItem);
        const productRepo = activeManager.getRepository(Product);
        const variantRepo = activeManager.getRepository(ProductVariant);

        // 1. Generate Sequenced Client PO tracking string safely
        const generatedNumber = await this.generateInternalSequenceNumber(activeManager);

        // 2. Map structural parent fields, forcing initial status to DRAFT
              // 2. Map structural parent fields, forcing initial status to DRAFT
        const parentOrder = cpoRepo.create({
            tenantId: dto.tenantId,
            clientId: dto.clientId,
            siteId: dto.siteId || null, // 🚀 FIXED: Assigns your incoming siteId tracking value here!
            clientPoNumber: generatedNumber,
            poDate: new Date(),
            requestedDeliveryDate: dto.requestedDeliveryDate || null,
            status: POStatus.DRAFT, 
            totalAmount: 0.00, 
            clientNotes: dto.clientNotes || '',
            internalNotes: `Generated by site workflow automation routing.`
        });


        const savedParent = await cpoRepo.save(parentOrder);
        const enrichedItems: ClientPurchaseOrderItem[] = [];

        // 3. Process material records and snapshot string templates
                // 3. Process material records and snapshot string templates
        for (const itemInput of dto.items) {
            const lineItem = cpoiRepo.create();
            lineItem.clientPurchaseOrderId = savedParent.id;
            lineItem.clientPurchaseOrder = savedParent;
            lineItem.quantity = Number(itemInput.quantity || 1);
            lineItem.finalPrice = 0.00; 

            let chosenUom = itemInput.purchaseUom?.trim();

            // Pathway A: Flat Sanitary Product Template
            if (itemInput.productId && !itemInput.productVariantId) {
                const product = await productRepo.findOne({
                    where: { id: itemInput.productId, tenantId: dto.tenantId }
                });
                if (!product) throw new Error(`Material Product ID ${itemInput.productId} not found.`);

                if (!chosenUom) {
                    chosenUom = product.defaultPurchaseUom || product.baseUom || 'PCS';
                }

                lineItem.productId = product.id;
                lineItem.productVariantId = null;
                lineItem.prodName = product.prodName;
                lineItem.sku = product.sku;
                lineItem.purchaseUom = chosenUom;

            // Pathway B: Variant Sanitary Product Template
            } else if (itemInput.productVariantId && !itemInput.productId) {
                const variant = await variantRepo.findOne({
                    where: { id: itemInput.productVariantId },
                    relations: ['productTemplate']
                });
                if (!variant || variant.productTemplate.tenantId !== dto.tenantId) {
                    throw new Error(`Material Variant ID ${itemInput.productVariantId} not found.`);
                }

                if (!chosenUom) {
                    chosenUom = variant.productTemplate.defaultPurchaseUom || variant.productTemplate.baseUom || 'PCS';
                }

                const sizeStr = variant.size ? ` (${variant.size})` : '';
                const finishStr = variant.finish ? ` - ${variant.finish}` : '';

                lineItem.productId = null;
                lineItem.productVariantId = variant.id;
                lineItem.prodName = `${variant.productTemplate.prodName}${sizeStr}${finishStr}`;
                lineItem.sku = variant.sku;
                lineItem.purchaseUom = chosenUom;

            // 🚀 Pathway C: Fallback for Custom Text Strings (e.g. Free-Text Items like 'MOP1')
            } else {
                lineItem.productId = null;
                lineItem.productVariantId = null;
                // Use the string name passed down from the router payload mapping layers
                lineItem.prodName = (itemInput as any).prodName || 'Free-text Product Entry';
                lineItem.sku = (itemInput as any).sku || null;
                lineItem.purchaseUom = chosenUom || 'PCS';
            }

            enrichedItems.push(lineItem);
        }


        // 4. Persist child lines cleanly
        await cpoiRepo.save(enrichedItems);
        savedParent.items = enrichedItems;

        if (!isExternalTx && queryRunner) {
            await queryRunner.commitTransaction();
        }

        // Break serialization infinite loop recursion paths
        if (savedParent.items) {
            for (const item of savedParent.items) {
                delete (item as any).clientPurchaseOrder;
            }
        }
console.log('saving data.........................');

        return savedParent;

    } catch (error) {
        if (!isExternalTx && queryRunner) await queryRunner.rollbackTransaction();
        throw error;
    } finally {
        if (!isExternalTx && queryRunner) await queryRunner.release();
    }
}
/**
 * Strict PUT/PATCH Action: Manages modifications, item purging, and state mutations
 * like transitioning from DRAFT to PENDING_APPROVAL.
 */
async updateClientPurchaseOrder(
    id: number,
    tenantId: number,
    updateDto: Partial<CreateClientPoDto> & { status?: POStatus },
    manager?: EntityManager
): Promise<ClientPurchaseOrder> {
    console.log('m in updateClientPurchaseOrder....................................');
    
    const isExternalTx = !!manager;
    const txManager = isExternalTx ? manager! : AppDataSource.manager;
    let queryRunner: any = null;

    // Isolate enrichedItems here so it can be re-assigned safely after merging header fields
    let enrichedItems: ClientPurchaseOrderItem[] = [];

    try {
        if (!isExternalTx) {
            queryRunner = AppDataSource.createQueryRunner();
            await queryRunner.connect();
            await queryRunner.startTransaction();
        }

        const activeManager = isExternalTx ? txManager : queryRunner.manager;

        const cpoRepo = activeManager.getRepository(ClientPurchaseOrder);
        const cpoiRepo = activeManager.getRepository(ClientPurchaseOrderItem);
        const productRepo = activeManager.getRepository(Product);
        const variantRepo = activeManager.getRepository(ProductVariant);

        // 🔒 Multi-Tenant Boundary Check
        const existingPo = await cpoRepo.findOne({ where: { id, tenantId } });
        if (!existingPo) throw new Error("Client Purchase Order record not found or unauthorized.");

        // 🛠️ State Machine Guardrail
        if (existingPo.status !== POStatus.DRAFT) {
            throw new Error(`Cannot modify a Client Purchase Order with status: ${existingPo.status}`);
        }

        // 📑 Handle incoming items if updating contents during Draft phase
        if (updateDto.items && updateDto.items.length > 0) {
            // Delete old items first to cleanly regenerate lines
            await cpoiRepo.delete({ clientPurchaseOrderId: existingPo.id });

            for (const itemInput of updateDto.items) {
                const lineItem = cpoiRepo.create();
                lineItem.clientPurchaseOrderId = existingPo.id;
                lineItem.clientPurchaseOrder = existingPo;
                lineItem.quantity = Number(itemInput.quantity || 1);
                lineItem.finalPrice = 0.00;

                let chosenUom = itemInput.purchaseUom?.trim();

                if (itemInput.productId && !itemInput.productVariantId) {
                    const product = await productRepo.findOne({ where: { id: itemInput.productId, tenantId } });
                    if (!product) throw new Error(`Material Product ID ${itemInput.productId} not found.`);
                    if (!chosenUom) chosenUom = product.defaultPurchaseUom || product.baseUom || 'PCS';
                    
                    lineItem.productId = product.id;
                    lineItem.productVariantId = null;
                    console.log('here ', product.prodName, '.............is to update');
                    lineItem.prodName = product.prodName;
                    lineItem.sku = product.sku;
                    lineItem.purchaseUom = chosenUom;

                } else if (itemInput.productVariantId && !itemInput.productId) {
                    const variant = await variantRepo.findOne({ where: { id: itemInput.productVariantId }, relations: ['productTemplate'] });
                    if (!variant || variant.productTemplate.tenantId !== tenantId) throw new Error(`Material Variant ID ${itemInput.productVariantId} not found.`);
                    if (!chosenUom) chosenUom = variant.productTemplate.defaultPurchaseUom || variant.productTemplate.baseUom || 'PCS';

                    const sizeStr = variant.size ? ` (${variant.size})` : '';
                    const finishStr = variant.finish ? ` - ${variant.finish}` : '';

                    lineItem.productId = null;
                    lineItem.productVariantId = variant.id;
                    lineItem.prodName = `${variant.productTemplate.prodName}${sizeStr}${finishStr}`;
                    lineItem.sku = variant.sku;
                    lineItem.purchaseUom = chosenUom;
                }
                enrichedItems.push(lineItem);
            }
            console.log('saving enrichedItems:', enrichedItems);
            
            await cpoiRepo.save(enrichedItems);
            existingPo.items = enrichedItems;
        }

        // 🔄 Apply header updates and safely mutate the status machine string
        // 🚨 FIX: Extract and completely ignore raw 'items' from the payload destructuring
        const { 
            id: payloadId, 
            tenantId: payloadTenantId, 
            clientPoNumber, 
            items: rawItems, // 👈 Stripped out here
            ...updatableFields 
        } = updateDto;
        
        // Merges only non-item header fields (clientId, siteId, clientNotes, etc.)
        cpoRepo.merge(existingPo, updatableFields);

        // 🚨 FIX: Re-bind enriched entities if they were updated in this execution
        if (enrichedItems.length > 0) {
            existingPo.items = enrichedItems;
        }

        // If supervisor requested submission, switch status now
        if (updateDto.status === POStatus.PENDING_APPROVAL) {
            // Validation step: Prevent submitting an empty PO for approval
            const finalItemCount = await cpoiRepo.count({ where: { clientPurchaseOrderId: existingPo.id } });
            if (finalItemCount === 0 && (!existingPo.items || existingPo.items.length === 0)) {
                throw new Error("Cannot submit an empty Purchase Order for approval.");
            }
            existingPo.status = POStatus.PENDING_APPROVAL;
            existingPo.internalNotes += ` | Submitted for approval on ${new Date().toISOString()}`;
        }

        const targetOrder = await cpoRepo.save(existingPo);

        if (!isExternalTx && queryRunner) {
            await queryRunner.commitTransaction();
        }

        if (targetOrder.items) {
            for (const item of targetOrder.items) {
                delete (item as any).clientPurchaseOrder;
            }
        }

        return targetOrder;

    } catch (error) {
        if (!isExternalTx && queryRunner) await queryRunner.rollbackTransaction();
        throw error;
    } finally {
        if (!isExternalTx && queryRunner) await queryRunner.release();
    }
}



    /**
     * Builds sequential tracking strings using a pessimistic database row lock.
     */
    private async generateInternalSequenceNumber(transactionalEntityManager: EntityManager): Promise<string> {
        const now = new Date();
        const yearMonth = `${now.getFullYear().toString().slice(-2)}${(now.getMonth() + 1).toString().padStart(2, '0')}`;
        const docType = "CLIENT_REQ_PO";

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

        return `CPO-${yearMonth}-${nextValue}`;
    }
}

export default ClientPurchaseOrderService