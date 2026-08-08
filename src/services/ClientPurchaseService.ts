import { EntityManager, In, QueryRunner, Repository } from 'typeorm';
import { AppDataSource } from '../../data-source'; 
import { ClientPurchaseOrder, Client_POStatus } from '../entity/ClientPurchaseOrder';
import { ClientPurchaseOrderItem } from '../entity/ClientPurchaseOrderItem';
import { Product } from '../entity/Product';
import { ProductVariant } from '../entity/productVariant';
import { DocumentSequence } from '../entity/DocumentSequence';
import { OrderSourceType, SalesOrder } from '../entity/SalesOrder';
import { SalesOrderItem } from '../entity/SalesOrderItem';
import DocumentConversionEngine from './DocumentConversionEngine';
import { getSalesOrderRepository } from '../dependencies';

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

    async convertClientPOToSalesOrder(
    poId: number,
    tenantId: number,
    userId: number,
    manager?: EntityManager
): Promise<SalesOrder> {

    const isExternalTx = !!manager;

    const txManager =
        isExternalTx
            ? manager!
            : AppDataSource.manager;

            //Pending: Important and global check, see below line where is just imported (nothing else)
                //need to check whether unnecessary code is written
    let queryRunner: QueryRunner | null = null;

    try {

        if (!isExternalTx) {

            queryRunner =
                AppDataSource.createQueryRunner();

            await queryRunner.connect();

            await queryRunner.startTransaction();

        }

        const activeManager =
            isExternalTx
                ? txManager
                : queryRunner!.manager;

        const salesService =
            getSalesOrderRepository();

        const channelCode = "Z";

        const generatedSoNumber =
            await salesService.generateSalesOrderNumber(
                activeManager,
                channelCode
            );

        const engine =
            new DocumentConversionEngine();

        const result =
            await engine.convertClientPOToSalesOrder(
                activeManager,
                tenantId,
                poId,
                generatedSoNumber,
                userId
            );

        if (!isExternalTx) {
            await queryRunner!.commitTransaction();
        }

        return result;

    }
    catch (error) {

        if (!isExternalTx && queryRunner) {
            await queryRunner.rollbackTransaction();
        }

        throw error;

    }
    finally {

        if (!isExternalTx && queryRunner) {
            await queryRunner.release();
        }

    }

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
    /* ---------------------------------------------------------------------
       GET CLIENT PO LIST FOR TENANT, SITE, OPTIONAL CLIENT ID & STATUSES
       --------------------------------------------------------------------- */
    async getClientPOsFiltered(
        tenantId: number,
        siteId?: number,
        clientId?: number,
        statuses?: string[], // 🚀 NEW: Added optional parameter
        includeConverted?: boolean,
        manager?: EntityManager
    ): Promise<ClientPurchaseOrder[]> {
        if (!this.clientPoRepo) {
            throw new Error('ClientPurchaseOrderService repository not initialized.');
        }

        console.log('Filtering Client Purchase Orders for Tenant:', tenantId, ' Site:', siteId, ' Client:', clientId, ' Statuses:', statuses);

        const repo = manager ? manager.getRepository(ClientPurchaseOrder) : this.clientPoRepo;

        // 1. Initialize the TypeORM conditional query block matching primary tenant indexes
        const whereConditions: any = { tenantId };

        // 2. Map structural query target arguments securely
        if (siteId !== undefined && siteId !== null && !isNaN(siteId)) {
            whereConditions.siteId = siteId;
        }

        if (clientId !== undefined && clientId !== null && !isNaN(clientId)) {
            whereConditions.clientId = clientId;
        }

        // 🚀 NEW: Dynamically map incoming statuses array using TypeORM's In operator
        if (statuses && statuses.length > 0) {
            whereConditions.status = In(statuses);
        }
        
        if (!includeConverted) {
           whereConditions.isConvertedToSales = false;
        }
        
console.log('result......',await repo.find({
            where: whereConditions,
            relations: { items: true },
            order: { id: 'DESC' } 
        }));    

        // 3. Execute find operation tracking nested line item sub-tables
        return await repo.find({
            where: whereConditions,
            relations: { items: true },
            order: { id: 'DESC' } 
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

    // Add to ClientPurchaseOrder Service
async getPOSummaryCount(
    tenantId: number,
    siteId?: number,
    clientId?: number,
    manager?: EntityManager
): Promise<Record<string, number>> {
    const repo = manager ? manager.getRepository(ClientPurchaseOrder) : this.clientPoRepo;
    
    const query = repo.createQueryBuilder('po')
        .select('po.status', 'status')
        .addSelect('COUNT(po.id)', 'count')
        .where('po.tenantId = :tenantId', { tenantId });

    if (siteId !== undefined && siteId !== null && !isNaN(siteId)) {
        query.andWhere('po.siteId = :siteId', { siteId });
    }
    if (clientId !== undefined && clientId !== null && !isNaN(clientId)) {
        query.andWhere('po.clientId = :clientId', { clientId });
    }

    const rawResults = await query.groupBy('po.status').getRawMany();
    
    // Transform array [{ status: 'DRAFT', count: '5' }] into object { DRAFT: 5 }
    return rawResults.reduce((acc, row) => {
        acc[row.status] = parseInt(row.count, 10);
        return acc;
    }, {} as Record<string, number>);
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
            status: Client_POStatus.DRAFT, 
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
    updateDto: Partial<CreateClientPoDto> & { status?: Client_POStatus },
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
        if (existingPo.status !== Client_POStatus.DRAFT) {
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
        if (updateDto.status === Client_POStatus.PENDING_APPROVAL) {
            // Validation step: Prevent submitting an empty PO for approval
            const finalItemCount = await cpoiRepo.count({ where: { clientPurchaseOrderId: existingPo.id } });
            if (finalItemCount === 0 && (!existingPo.items || existingPo.items.length === 0)) {
                throw new Error("Cannot submit an empty Purchase Order for approval.");
            }
            existingPo.status = Client_POStatus.PENDING_APPROVAL;
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


//Note/Protocol:Here ClientPurchaseorder is straiht way deleted if its not SENT yet means if DRAFT/PENDING_APPROVAL/APPROVED
//1Aug2026
    async handleDeleteOrCancelClientRequest(
        tenantId: number,
        clientPoNumber: string,
        manager?: EntityManager
    ): Promise<{ success: boolean; action: 'DELETED' | 'CANCELLED' }> {
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
            const clientPoRepo = activeManager.getRepository(ClientPurchaseOrder);

            // Locate the client purchase order using tenantId and the unique clientPoNumber
            const existingOrder = await clientPoRepo.findOne({
                where: { tenantId, clientPoNumber },
                relations: ['items'] // Loaded to pass to the stock reversal helper if needed
            });

            if (!existingOrder) {
                throw new Error(`[ClientPurchaseService] Client Purchase Order not found for Number: ${clientPoNumber}`);
            }

            let actionResult: 'DELETED' | 'CANCELLED';

            // ✅ MODIFIED CONDITION: Hard delete if DRAFT or PENDING_APPROVAL
            if (existingOrder.status === Client_POStatus.DRAFT || existingOrder.status === Client_POStatus.PENDING_APPROVAL || existingOrder.status === Client_POStatus.APPROVED) {
                console.log(`[ClientPurchaseService] Hard deleting ${existingOrder.status} Client PO: ${existingOrder.clientPoNumber}. Stock adjustment skipped.`);
                
                // Erase record and cascade items completely
                await clientPoRepo.remove(existingOrder);
                actionResult = 'DELETED';
            } else {
                console.log(`[ClientPurchaseService] Cancelling active Client PO: ${existingOrder.clientPoNumber}`);
                
                             
                // Mutate status to CANCELLED enum value
                existingOrder.status = Client_POStatus.CANCELLED;
                await clientPoRepo.save(existingOrder);
                actionResult = 'CANCELLED';
            }

            if (!isExternalTransaction && queryRunner) {
                await queryRunner.commitTransaction();
            }

            return { success: true, action: actionResult };
        } catch (error) {
            if (!isExternalTransaction && queryRunner) await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            if (!isExternalTransaction && queryRunner) await queryRunner.release();
        }
    }

async processPoApproval(
    id: number,
    tenantId: number,
    action: 'APPROVE' | 'REJECT',
    updatedItems?: any[]
): Promise<ClientPurchaseOrder> {
    
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
        const cpoRepo = queryRunner.manager.getRepository(ClientPurchaseOrder);
        const cpoiRepo = queryRunner.manager.getRepository(ClientPurchaseOrderItem);
        const productRepo = queryRunner.manager.getRepository(Product);
        const variantRepo = queryRunner.manager.getRepository(ProductVariant);

        // 🔒 1. Fetch record across Multi-Tenant Boundaries
        const existingPo = await cpoRepo.findOne({ 
            where: { id, tenantId },
            relations: ['items'] 
        });
        if (!existingPo) throw new Error("Client Purchase Order record not found or unauthorized.");

        // 🛠️ 2. State Machine Guardrail
        // Blocks requests if the document is not explicitly locked under review
        if (existingPo.status !== Client_POStatus.PENDING_APPROVAL) {
            throw new Error(`Approval processing denied. Order is currently in ${existingPo.status} status.`);
        }

        // 📑 3. Mutate lines if the approver submitted altered item quantities
        if (action === 'APPROVE' && updatedItems && updatedItems.length > 0) {
            // Delete original line records cleanly
            await cpoiRepo.delete({ clientPurchaseOrderId: existingPo.id });

            const enrichedItems: ClientPurchaseOrderItem[] = [];
            for (const itemInput of updatedItems) {
                const lineItem = cpoiRepo.create();
                lineItem.clientPurchaseOrderId = existingPo.id;
                lineItem.clientPurchaseOrder = existingPo;
                lineItem.quantity = Number(itemInput.quantity || 1);
                lineItem.finalPrice = 0.00; // Recalculate based on pricing system rules if required

                let chosenUom = itemInput.purchaseUom?.trim();

                if (itemInput.productId && !itemInput.productVariantId) {
                    const product = await productRepo.findOne({ where: { id: itemInput.productId, tenantId } });
                    if (!product) throw new Error(`Material Product ID ${itemInput.productId} not found.`);
                    if (!chosenUom) chosenUom = product.defaultPurchaseUom || product.baseUom || 'PCS';
                    
                    lineItem.productId = product.id;
                    lineItem.productVariantId = null;
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
            
            await cpoiRepo.save(enrichedItems);
            existingPo.items = enrichedItems;
        }

        // 🚦 4. Resolve Final Enum State Transitions
        if (action === 'APPROVE') {
            existingPo.status = Client_POStatus.APPROVED;
            
            // 💡 System Design Hook: Your Sales Order automation should run right here:
            // await this.createSalesOrderFromApprovedPo(existingPo, queryRunner.manager);
            
        } else if (action === 'REJECT') {
            // Using CANCELLED as your closest matching enum fallback for structural workflow rejections
            existingPo.status = Client_POStatus.CANCELLED; 
        }

        // 💾 5. Save header details and execute transaction database flush
            // 💾 5. Save header details and execute transaction database flush
        await cpoRepo.save(existingPo);
        
        // 🧼 Fetch a fresh, clean instance across the queryRunner manager to avoid circular pollution
        const cleanPo = await queryRunner.manager.getRepository(ClientPurchaseOrder).findOne({
            where: { id: existingPo.id, tenantId },
            relations: ['items']
        });

        await queryRunner.commitTransaction();
        
        if (!cleanPo) throw new Error("Failed to reload processed Purchase Order.");
        return cleanPo;

    } catch (error: any) {

        await queryRunner.rollbackTransaction();
        console.error('[CPO Service Workflow Rollback Failure]:', error.message || error);
        throw error;
    } finally {
        await queryRunner.release();
    }
}

async processPoDispatch(
id: number,
tenantId: number,
action: 'SENT',
updatedItems?: any[]
): Promise<ClientPurchaseOrder> { 

const queryRunner = AppDataSource.createQueryRunner();
await queryRunner.connect();
await queryRunner.startTransaction();

try {
const cpoRepo = queryRunner.manager.getRepository(ClientPurchaseOrder);
const cpoiRepo = queryRunner.manager.getRepository(ClientPurchaseOrderItem);
const productRepo = queryRunner.manager.getRepository(Product);
const variantRepo = queryRunner.manager.getRepository(ProductVariant);
// 🔒 1. Fetch record across Multi-Tenant Boundaries
const existingPo = await cpoRepo.findOne({ 
    where: { id, tenantId },
    relations: ['items'] 
});
if (!existingPo) throw new Error("Client Purchase Order record not found or unauthorized.");

// 🛠️ 2. State Machine Guardrail
// Blocks requests if the document is not explicitly APPROVED
if (existingPo.status !== Client_POStatus.APPROVED) {
    throw new Error(`Dispatch processing denied. Order is currently in ${existingPo.status} status.`);
}

// 📑 3. Mutate lines if the sender submitted altered item quantities
if (updatedItems && updatedItems.length > 0) {
    // Delete original line records cleanly
    await cpoiRepo.delete({ clientPurchaseOrderId: existingPo.id });

    const enrichedItems: ClientPurchaseOrderItem[] = [];
    for (const itemInput of updatedItems) {
        const lineItem = cpoiRepo.create();
        lineItem.clientPurchaseOrderId = existingPo.id;
        lineItem.clientPurchaseOrder = existingPo;
        lineItem.quantity = Number(itemInput.quantity || 1);
        lineItem.finalPrice = 0.00; // Recalculate based on pricing system rules if required

        let chosenUom = itemInput.purchaseUom?.trim();

        if (itemInput.productId && !itemInput.productVariantId) {
            const product = await productRepo.findOne({ where: { id: itemInput.productId, tenantId } });
            if (!product) throw new Error(`Material Product ID ${itemInput.productId} not found.`);
            if (!chosenUom) chosenUom = product.defaultPurchaseUom || product.baseUom || 'PCS';
            
            lineItem.productId = product.id;
            lineItem.productVariantId = null;
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
    
    await cpoiRepo.save(enrichedItems);
    existingPo.items = enrichedItems;
}

// 🚦 4. Resolve Final Enum State Transitions
if (action === 'SENT') {
    existingPo.status = Client_POStatus.SENT;
    
    // 💡 System Design Hook: Your Vendor EDI transmission or email alert should run right here:
    // await this.transmitPoToExternalVendor(existingPo, queryRunner.manager);
}

// 💾 5. Save header details and execute transaction database flush
await cpoRepo.save(existingPo);

// 🧼 Fetch a fresh, clean instance across the queryRunner manager to avoid circular pollution
const cleanPo = await queryRunner.manager.getRepository(ClientPurchaseOrder).findOne({
    where: { id: existingPo.id, tenantId },
    relations: ['items']
});

await queryRunner.commitTransaction();

if (!cleanPo) throw new Error("Failed to reload processed Purchase Order.");
return cleanPo;

} catch (error: any) {
await queryRunner.rollbackTransaction();
console.error('[CPO Service Dispatch Rollback Failure]:', error.message || error);
throw error;
} finally {
await queryRunner.release();
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

    private async generateSalesOrderNumber(
    transactionalEntityManager: EntityManager
): Promise<string> {

    const now = new Date();

    const yearMonth =
        `${now.getFullYear().toString().slice(-2)}${(now.getMonth() + 1)
            .toString()
            .padStart(2, '0')}`;

    const docType = "SALES_ORDER";

    let sequence = await transactionalEntityManager
        .getRepository(DocumentSequence)
        .createQueryBuilder("seq")
        .setLock("pessimistic_write")
        .where(
            "seq.documentType = :docType AND seq.prefixYearMonth = :yearMonth",
            { docType, yearMonth }
        )
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

    return `SO-${yearMonth}-${nextValue}`;
}

}

export default ClientPurchaseOrderService