import { EntityManager, Repository } from 'typeorm';
import { AppDataSource } from '../../data-source'; 
import { ClientRFQOrder, RFQStatus } from '../entity/ClientRFQOrder';
import { ClientRFQOrderItem } from '../entity/ClientRFQOrderItem';
import { Product } from '../entity/Product';
import { ProductVariant } from '../entity/productVariant';
import { DocumentSequence } from '../entity/DocumentSequence';

interface CreateClientRFQDto {
    id?:number;
    tenantId: number;
    clientId: number;
    siteId: number | null;
    clientRFQNumber:string;
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

export class ClientRFQOrderService {
    private clientRFQRepo!: Repository<ClientRFQOrder>;

    async init(repo: Repository<ClientRFQOrder>): Promise<void> {
        this.clientRFQRepo = repo;
        console.log("ClientRFQOrderService backend layer initialized successfully.");
    }

        /* ---------------------------------------------------------
       GET SINGLE CLIENT PO FOR TENANT & ID – Aligned for Client Orders
       --------------------------------------------------------- */
    async getClientRFQ(
        tenantId: number,
        cpoId: number,
        manager?: EntityManager
    ): Promise<ClientRFQOrder[]> {
        if (!this.clientRFQRepo) {
            throw new Error(
                'ClientRFQOrderService repository not initialized. Call init() first.'
            );
        }

        const repo = manager
            ? manager.getRepository(ClientRFQOrder)
            : this.clientRFQRepo;

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
    async getClientRFQsFiltered(
        tenantId: number,
        siteId?: number,
        clientId?: number,
        manager?: EntityManager
    ): Promise<ClientRFQOrder[]> {
        if (!this.clientRFQRepo) {
            throw new Error('ClientRFQOrderService repository not initialized.');
        }

        console.log('Filtering Client RFQ Orders for Tenant:', tenantId, ' Site:', siteId, ' Client:', clientId);

        const repo = manager ? manager.getRepository(ClientRFQOrder) : this.clientRFQRepo;

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
    ): Promise<ClientRFQOrder[]> {
        if (!this.clientRFQRepo) {
            throw new Error(
                'ClientRFQOrderService repository not initialized. Call init() first.'
            );
        }

        const repo = manager
            ? manager.getRepository(ClientRFQOrder)
            : this.clientRFQRepo;

        // Extracts all requisitions under the active multi-tenant workspace context safely
        const orders = await repo.find({ 
            where: { tenantId }, 
            relations: { items: true } 
        });
      
        return orders;
    }


    //Summary 
    // Add to ClientRFQOrder Service
async getRFQSummaryCount(
    tenantId: number,
    siteId?: number,
    clientId?: number,
    manager?: EntityManager
): Promise<Record<string, number>> {
    const repo = manager ? manager.getRepository(ClientRFQOrder) : this.clientRFQRepo;
    
    const query = repo.createQueryBuilder('rfq')
        .select('rfq.status', 'status')
        .addSelect('COUNT(rfq.id)', 'count')
        .where('rfq.tenantId = :tenantId', { tenantId });

    if (siteId !== undefined && siteId !== null && !isNaN(siteId)) {
        query.andWhere('rfq.siteId = :siteId', { siteId });
    }
    if (clientId !== undefined && clientId !== null && !isNaN(clientId)) {
        query.andWhere('rfq.clientId = :clientId', { clientId });
    }

    const rawResults = await query.groupBy('rfq.status').getRawMany();
    
    return rawResults.reduce((acc, row) => {
        acc[row.status] = parseInt(row.count, 10);
        return acc;
    }, {} as Record<string, number>);
}

    /**
     * Records bare material tracking entries without altering live inventory balances.
     */
    async createClientRFQOrder(
    dto: CreateClientRFQDto,
    manager?: EntityManager
): Promise<ClientRFQOrder> {
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

        const cpoRepo = activeManager.getRepository(ClientRFQOrder);
        const cpoiRepo = activeManager.getRepository(ClientRFQOrderItem);
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
            clientRFQNumber: generatedNumber,
            rfqDate: new Date(),
            requestedDeliveryDate: dto.requestedDeliveryDate || null,
            status: RFQStatus.DRAFT, 
           
            clientNotes: dto.clientNotes || '',
            internalNotes: `Generated by site workflow automation routing.`
        });


        const savedParent = await cpoRepo.save(parentOrder);
        const enrichedItems: ClientRFQOrderItem[] = [];

        // 3. Process material records and snapshot string templates
                // 3. Process material records and snapshot string templates
        for (const itemInput of dto.items) {
            const lineItem = cpoiRepo.create();
            lineItem.clientRFQOrderId = savedParent.id;
            lineItem.clientRFQOrder = savedParent;
            lineItem.quantity = Number(itemInput.quantity || 1);
           

            let chosenUom = itemInput.purchaseUom?.trim();

            // Pathway A: Flat Sanitary Product Template
            if (itemInput.productId && !itemInput.productVariantId) {
                const product = await productRepo.findOne({
                    where: { id: itemInput.productId, tenantId: dto.tenantId }
                });
                if (!product) throw new Error(`Material Product ID ${itemInput.productId} not found.`);

                if (!chosenUom) {
                    chosenUom = product.defaultRFQUom || product.baseUom || 'PCS';
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
                    chosenUom = variant.productTemplate.defaultRFQUom || variant.productTemplate.baseUom || 'PCS';
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
                delete (item as any).clientRFQOrder;
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
async updateClientRFQOrder(
    id: number,
    tenantId: number,
    updateDto: Partial<CreateClientRFQDto> & { status?: RFQStatus },
    manager?: EntityManager
): Promise<ClientRFQOrder> {
    console.log('m in updateClientRFQOrder....................................');
    
    const isExternalTx = !!manager;
    const txManager = isExternalTx ? manager! : AppDataSource.manager;
    let queryRunner: any = null;

    // Isolate enrichedItems here so it can be re-assigned safely after merging header fields
    let enrichedItems: ClientRFQOrderItem[] = [];

    try {
        if (!isExternalTx) {
            queryRunner = AppDataSource.createQueryRunner();
            await queryRunner.connect();
            await queryRunner.startTransaction();
        }

        const activeManager = isExternalTx ? txManager : queryRunner.manager;

        const cpoRepo = activeManager.getRepository(ClientRFQOrder);
        const cpoiRepo = activeManager.getRepository(ClientRFQOrderItem);
        const productRepo = activeManager.getRepository(Product);
        const variantRepo = activeManager.getRepository(ProductVariant);

        // 🔒 Multi-Tenant Boundary Check
        const existingRFQ = await cpoRepo.findOne({ where: { id, tenantId } });
        if (!existingRFQ) throw new Error("Client RFQ Order record not found or unauthorized.");

        // 🛠️ State Machine Guardrail
        if (existingRFQ.status !== RFQStatus.DRAFT) {
            throw new Error(`Cannot modify a Client RFQ Order with status: ${existingRFQ.status}`);
        }

        // 📑 Handle incoming items if updating contents during Draft phase
        if (updateDto.items && updateDto.items.length > 0) {
            // Delete old items first to cleanly regenerate lines
            await cpoiRepo.delete({ clientRFQOrderId: existingRFQ.id });

            for (const itemInput of updateDto.items) {
                const lineItem = cpoiRepo.create();
                lineItem.clientRFQOrderId = existingRFQ.id;
                lineItem.clientRFQOrder = existingRFQ;
                lineItem.quantity = Number(itemInput.quantity || 1);
              

                let chosenUom = itemInput.purchaseUom?.trim();

                if (itemInput.productId && !itemInput.productVariantId) {
                    const product = await productRepo.findOne({ where: { id: itemInput.productId, tenantId } });
                    if (!product) throw new Error(`Material Product ID ${itemInput.productId} not found.`);
                    if (!chosenUom) chosenUom = product.defaultRFQUom || product.baseUom || 'PCS';
                    
                    lineItem.productId = product.id;
                    lineItem.productVariantId = null;
                    console.log('here ', product.prodName, '.............is to update');
                    lineItem.prodName = product.prodName;
                    lineItem.sku = product.sku;
                    lineItem.purchaseUom = chosenUom;

                } else if (itemInput.productVariantId && !itemInput.productId) {
                    const variant = await variantRepo.findOne({ where: { id: itemInput.productVariantId }, relations: ['productTemplate'] });
                    if (!variant || variant.productTemplate.tenantId !== tenantId) throw new Error(`Material Variant ID ${itemInput.productVariantId} not found.`);
                    if (!chosenUom) chosenUom = variant.productTemplate.defaultRFQUom || variant.productTemplate.baseUom || 'PCS';

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
            existingRFQ.items = enrichedItems;
        }

        // 🔄 Apply header updates and safely mutate the status machine string
        // 🚨 FIX: Extract and completely ignore raw 'items' from the payload destructuring
        const { 
            id: payloadId, 
            tenantId: payloadTenantId, 
            clientRFQNumber, 
            items: rawItems, // 👈 Stripped out here
            ...updatableFields 
        } = updateDto;
        
        // Merges only non-item header fields (clientId, siteId, clientNotes, etc.)
        cpoRepo.merge(existingRFQ, updatableFields);

        // 🚨 FIX: Re-bind enriched entities if they were updated in this execution
        if (enrichedItems.length > 0) {
            existingRFQ.items = enrichedItems;
        }

        // If supervisor requested submission, switch status now
        if (updateDto.status === RFQStatus.PENDING_APPROVAL) {
            // Validation step: Prevent submitting an empty PO for approval
            const finalItemCount = await cpoiRepo.count({ where: { clientRFQOrderId: existingRFQ.id } });
            if (finalItemCount === 0 && (!existingRFQ.items || existingRFQ.items.length === 0)) {
                throw new Error("Cannot submit an empty RFQ Order for approval.");
            }
            existingRFQ.status = RFQStatus.PENDING_APPROVAL;
            existingRFQ.internalNotes += ` | Submitted for approval on ${new Date().toISOString()}`;
        }

        const targetOrder = await cpoRepo.save(existingRFQ);

        if (!isExternalTx && queryRunner) {
            await queryRunner.commitTransaction();
        }

        if (targetOrder.items) {
            for (const item of targetOrder.items) {
                delete (item as any).clientRFQOrder;
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


async processRFQApproval(
    id: number,
    tenantId: number,
    action: 'APPROVE' | 'REJECT',
    updatedItems?: any[]
): Promise<ClientRFQOrder> {
    
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
        const cpoRepo = queryRunner.manager.getRepository(ClientRFQOrder);
        const cpoiRepo = queryRunner.manager.getRepository(ClientRFQOrderItem);
        const productRepo = queryRunner.manager.getRepository(Product);
        const variantRepo = queryRunner.manager.getRepository(ProductVariant);

        // 🔒 1. Fetch record across Multi-Tenant Boundaries
        const existingRFQ = await cpoRepo.findOne({ 
            where: { id, tenantId },
            relations: ['items'] 
        });
        if (!existingRFQ) throw new Error("Client RFQ Order record not found or unauthorized.");

        // 🛠️ 2. State Machine Guardrail
        // Blocks requests if the document is not explicitly locked under review
        if (existingRFQ.status !== RFQStatus.PENDING_APPROVAL) {
            throw new Error(`Approval processing denied. Order is currently in ${existingRFQ.status} status.`);
        }

        // 📑 3. Mutate lines if the approver submitted altered item quantities
        if (action === 'APPROVE' && updatedItems && updatedItems.length > 0) {
            // Delete original line records cleanly
            await cpoiRepo.delete({ clientRFQOrderId: existingRFQ.id });

            const enrichedItems: ClientRFQOrderItem[] = [];
            for (const itemInput of updatedItems) {
                const lineItem = cpoiRepo.create();
                lineItem.clientRFQOrderId = existingRFQ.id;
              //  lineItem.clientRFQOrder = existingRFQ; // making cirular reference so remove it
                lineItem.quantity = Number(itemInput.quantity || 1);
                
               

                if (itemInput.productId && !itemInput.productVariantId) {
                    const product = await productRepo.findOne({ where: { id: itemInput.productId, tenantId } });
                    if (!product) throw new Error(`Material Product ID ${itemInput.productId} not found.`);
                   
                    
                    lineItem.productId = product.id;
                    lineItem.productVariantId = null;
                    lineItem.prodName = product.prodName;
                    lineItem.sku = product.sku;
                   

                } else if (itemInput.productVariantId && !itemInput.productId) {
                    const variant = await variantRepo.findOne({ where: { id: itemInput.productVariantId }, relations: ['productTemplate'] });
                    if (!variant || variant.productTemplate.tenantId !== tenantId) throw new Error(`Material Variant ID ${itemInput.productVariantId} not found.`);
                   

                    const sizeStr = variant.size ? ` (${variant.size})` : '';
                    const finishStr = variant.finish ? ` - ${variant.finish}` : '';

                    lineItem.productId = null;
                    lineItem.productVariantId = variant.id;
                    lineItem.prodName = `${variant.productTemplate.prodName}${sizeStr}${finishStr}`;
                    lineItem.sku = variant.sku;
                    
                }
                enrichedItems.push(lineItem);
            }
            
            await cpoiRepo.save(enrichedItems);
            existingRFQ.items = enrichedItems;
        }

        // 🚦 4. Resolve Final Enum State Transitions
        if (action === 'APPROVE') {
            existingRFQ.status = RFQStatus.APPROVED;
            
            // 💡 System Design Hook: Your Sales Order automation should run right here:
            // await this.createSalesOrderFromApprovedPo(existingRFQ, queryRunner.manager);
            
        } else if (action === 'REJECT') {
            // Using CANCELLED as your closest matching enum fallback for structural workflow rejections
            existingRFQ.status = RFQStatus.CANCELLED; 
        }

        // 💾 5. Save header details and execute transaction database flush
        const savedRFQ = await cpoRepo.save(existingRFQ);
        await queryRunner.commitTransaction();
        
        return savedRFQ;

    } catch (error: any) {
        await queryRunner.rollbackTransaction();
        console.error('[CPO Service Workflow Rollback Failure]:', error.message || error);
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
        const docType = "CLIENT_REQ_RFQ";

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

        return `CRFQ-${yearMonth}-${nextValue}`;
    }
}

export default ClientRFQOrderService