import { EntityManager, Repository } from 'typeorm';
import { AppDataSource } from '../../data-source'; 
import { Quotation, QuotationStatus } from '../entity/Quotation';
import { QuotationItem } from '../entity/QuotationItem';
import { Customer } from '../entity/Customer';
import { Product } from '../entity/Product';
import { LineDiscount } from '../entity/LineDiscount';
import { IQuotationActions, QuotationWorkflowService, QuotationWorkflowType } from './QuotationWorkflowService';
import { ClientRFQOrder, RFQStatus } from '../entity/ClientRFQOrder';
import DocumentConversionEngine from './DocumentConversionEngine';
import { getTenantStrategyServiceRepository } from '../dependencies';
import { ClientRFQWorkflowService } from './ClientRFQWorkflowService';

 
export interface ICreateQuotationItemInput {
    productId?: number | null;
    productVariantId?: number | null;
    prodName: string;
    sku?: string | null;
    description?: string | null;
    unit: string;
    quantity: number;
    gstPercentage: number;
    customPrice: number;targetPrice:number;
    discount: number;
    customAttributes?: Record<string, any> | null;
}

interface CreateQuotationDto {
    tenantId: number;
    clientId: number;
    clientName: string;
    clientCategory?: string | null;
    contactPerson?: string | null;
    deliveryLocation?: string | null;
    remarksNotes?: string | null;
    createdByUserId?: number;
    items: ICreateQuotationItemInput[];
    [key: string]: any;
}

export interface CreatedQuotationResponse {
    quotation: Quotation;
}



//Convert to Quotation new approach:tag:convertToQuoteNewIdea
export interface QuotationWorkflowDto{

    quotationId:number;

    status:QuotationStatus;

    actions:IQuotationActions;

}
export class QuotationService {
    private quotationRepository!: Repository<Quotation>;

    //Convert to Quotation new approach:tag:convertToQuoteNewIdea
    private workflowService = new QuotationWorkflowService();
        private workflow = new QuotationWorkflowService();
        private workflow_client = new ClientRFQWorkflowService();
        

    
    async init(repo: Repository<Quotation>): Promise<void> {
        this.quotationRepository = repo;
        console.log("QuotationService repository initialized.");       
    }

    //Convert to Quotation new approach:tag:convertToQuoteNewIdea
    public async getWorkflow(
    quotationId:number,
    tenantId:number
    ):Promise<QuotationWorkflowDto>{

        const quotation = await this.quotationRepository.findOne({

            where:{
                id:quotationId,
                tenantId
            }

        });

        if(!quotation){

            throw new Error("Quotation not found.");

        }


         const tenantStrategyService =
                getTenantStrategyServiceRepository();

         const strategies =
        await tenantStrategyService
            .getTenantStrategies(tenantId);

    const workflowStrategy =
        strategies.find(
            s =>
                s.tenantStrategyName ===
                "Quotation_Workflow"
        );

    if (!workflowStrategy) {
        throw new Error(
            "Quotation Workflow not configured."
        );
    }

    const workflowName =
        workflowStrategy.tenantStrategy;

       const workflowType=this.toQuotationWorkflowType(workflowName) 
        return{

            quotationId:quotation.id,

            status:quotation.status,

            actions: await this.workflowService.getAllowedActions(workflowType,
                quotation.status
            )

        };

    }

    //helper function to map Quotation_Workflow strategy to enum
     toQuotationWorkflowType(
    value: string
): QuotationWorkflowType {

    if (
        Object.values(QuotationWorkflowType)
            .includes(value as QuotationWorkflowType)
    ) {
        return value as QuotationWorkflowType;
    }

    throw new Error(
        `Unsupported Quotation Workflow strategy: ${value}`
    );
}

    async getQuotation(tenantId: number, id: number): Promise<Quotation> {
        const result = await this.quotationRepository.findOne({
            where: { id, tenantId },
            relations: ['items', 'client']
        });
        if (!result) {
            throw new Error(`Quotation tracking record ID ${id} not discovered for tenant ${tenantId}.`);
        }
        return result;
    }

        async getQuotations(
            tenantId: number, 
            clientId?: number, 
            isClientPortal: boolean = false
        ): Promise<Quotation[]> {

                 

            const whereConditions: any = { tenantId };
            
            if (clientId) {
                whereConditions.clientId = clientId;
            }

            // Explicitly restrict to APPROVED status only for the Client Portal
            if (isClientPortal) {
                whereConditions.status = QuotationStatus.SENT;
            }

            return await this.quotationRepository.find({
                where: whereConditions,
                relations: ['items', 'client'],
                order: { createdAt: 'DESC' }
            });
        }


    async createQuotationClean(
        createDto: CreateQuotationDto,
        manager?: EntityManager
    ): Promise<CreatedQuotationResponse> {
      
        
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

            const quotationRepo = activeManager.getRepository(Quotation);
            const quotationItemRepo = activeManager.getRepository(QuotationItem);
            const customerRepo = activeManager.getRepository(Customer);

            const targetCustomer = await customerRepo.findOne({
                where: { id: createDto.clientId, tenantId: createDto.tenantId }
            });
            if (!targetCustomer) {
                throw new Error(`Customer ID ${createDto.clientId} does not exist under Tenant ID ${createDto.tenantId}.`);
            }

            let targetQuotation: Quotation;

            let existingRequest = await quotationRepo.findOne({ 
                where: { 
                    tenantId: createDto.tenantId,
                    clientId: createDto.clientId
                } 
            });

                       const structuredItems: QuotationItem[] = [];
            let aggregateTotal = 0;

            // 🌟 Get the Product repository to pull missing metadata strings out
            const productRepo = activeManager.getRepository(Product);

            for (const itemInput of (createDto.items || [])) {
                const itemNode = new QuotationItem();
                
                // Relational Links
                itemNode.productId = itemInput.productId ?? null;
                itemNode.productVariantId = itemInput.productVariantId ?? null;
                
                // 🚀 AUTO-RESOLUTION LAYER: If frontend doesn't pass prodName, fetch it from Master Product catalog
                let resolvedName = 'Product #' + itemNode.productId;
                let resolvedSku = null;

                if (itemNode.productId) {
                    const productMaster = await productRepo.findOne({ where: { id: itemNode.productId, tenantId: createDto.tenantId } });
                    if (productMaster) {
                        resolvedName = productMaster.prodName || productMaster.name || resolvedName;
                        resolvedSku = productMaster.sku || null;
                    }
                }

                // Assign resolved values to meet database non-null string validation rules
                itemNode.prodName = resolvedName;
                itemNode.sku = resolvedSku;

                // Rest of your transactional mappings
                itemNode.description = itemInput.description || null;
                itemNode.unit = itemInput.unit;
                
                // Metrics
                itemNode.quantity = Number(itemInput.quantity || 0.00);
                itemNode.gstPercentage = Number(itemInput.gstPercentage || 0.00);
                itemNode.customPrice = Number(itemInput.customPrice || 0.00);
                itemNode.discount = Number(itemInput.discount || 0.00);
                itemNode.customAttributes = itemInput.customAttributes ?? null;
                
                const baseAmount = itemNode.quantity * itemNode.customPrice;
                const netAfterDiscount = baseAmount - itemNode.discount;
                const taxAmount = netAfterDiscount * (itemNode.gstPercentage / 100);
                
                itemNode.totalItemAmount = Number((netAfterDiscount + taxAmount).toFixed(2));
                aggregateTotal += itemNode.totalItemAmount;

                structuredItems.push(itemNode);
            }


            createDto.totalAmount = Number(aggregateTotal.toFixed(2));

            if (existingRequest && createDto.id) { 
                console.log(`Modifying existing target quotation ID: ${existingRequest.id}`);
                
                await quotationItemRepo.delete({ quotationId: existingRequest.id });

                quotationRepo.merge(existingRequest, createDto);
                existingRequest.items = structuredItems;
                targetQuotation = await quotationRepo.save(existingRequest);
                
            } else {
                console.log(`Generating fresh Quotation configuration block`);
                
                const newQuotation = quotationRepo.create(createDto);
                newQuotation.items = structuredItems;
                
                targetQuotation = await quotationRepo.save(newQuotation);
            }

            if (!isExternalTransaction && queryRunner) {
                await queryRunner.commitTransaction();
            }

            return { quotation: targetQuotation };

        } catch (error) {
            if (!isExternalTransaction && queryRunner) {
                await queryRunner.rollbackTransaction();
            }
            console.error('Error encountered inside createQuotationClean:', error);
            throw error;
        } finally {
            if (!isExternalTransaction && queryRunner) {
                await queryRunner.release();
            }
        }
    }

   
    
    /**
     * Complete Order Calculation Engine processing applied promotions atomically
     */
    async createQuotationWithDiscounts(
        tenantId: number, 
        quotationData: any, 
        manager?: EntityManager
    ): Promise<Quotation> {
        const queryRunner = manager ? manager.queryRunner : AppDataSource.createQueryRunner();
        let shouldReleaseQueryRunner = false;

        try {
            if (!manager) {
                await queryRunner!.connect();
                await queryRunner!.startTransaction();
                shouldReleaseQueryRunner = true;
            }

            const tm = queryRunner!.manager;
            const quotationRepo = tm.getRepository(Quotation);
           
            const discountRepo = tm.getRepository(LineDiscount);

            // 1. Construct parent quotation mapping shells
            const quotation = quotationRepo.create({
                tenantId: tenantId,
                clientId: quotationData.clientId,
                clientName: quotationData.clientName,
                clientCategory: quotationData.clientCategory,
                contactPerson: quotationData.contactPerson,
                deliveryLocation: quotationData.deliveryLocation,
                remarksNotes: quotationData.remarksNotes,
                createdByUserId: quotationData.createdByUserId,
                totalAmount: 0.00 // Evaluated dynamically below
            });

           

// ==========================================
//  CORRECT IMPLEMENTATION RULE PATTERN
// ==========================================
let calculatedTotalAmount = 0;
const processingItems: QuotationItem[] = [];

for (const incomingLine of (quotationData.items || [])) {
     const quotationItemRepo=tm.getRepository(QuotationItem)
    // 💡 Create an individual entity instance explicitly typed as a single QuotationItem object
    const item: QuotationItem=tm.create(incomingLine )
    
    // ✅ Safe: Modifying the property on the single object instance, NOT the array collection
    item.discount = 0.00; 

    if (item.productId) {
        const activeDiscount = await discountRepo.findOne({
            where: { tenantId: tenantId, productId: item.productId, isActive: true },
            relations: ['discountType']
        });

        if (activeDiscount) {
            item.appliedLineDiscountId = activeDiscount.id;
            const itemSubtotalBase = Number(item.customPrice) * Number(item.quantity);
            const strategyLabel = activeDiscount.discountType ? activeDiscount.discountType.typeName : 'PERCENTAGE';

            if (strategyLabel === 'PERCENTAGE') {
                item.discount = itemSubtotalBase * (Number(activeDiscount.discountValue) / 100);
            } else if (strategyLabel === 'FIXED_AMOUNT') {
                item.discount = Number(activeDiscount.discountValue) * Number(item.quantity);
            }
        }
    }

    // Compute net totals using the individual 'item' variables context
    const rawGrossTotal = (Number(item.customPrice) * Number(item.quantity)) - Number(item.discount);
    const finalLineTotal = rawGrossTotal >= 0 ? rawGrossTotal : 0;
    
    const taxFactor = 1 + (Number(item.gstPercentage) / 100);
    item.totalItemAmount = Number((finalLineTotal * taxFactor).toFixed(2));

    calculatedTotalAmount += item.totalItemAmount;
    processingItems.push(item);
}


            quotation.items = processingItems;
            quotation.totalAmount = Number(calculatedTotalAmount.toFixed(2));

            // 4. Save entities and commit records safely
            const savedQuotation = await quotationRepo.save(quotation);

            if (shouldReleaseQueryRunner) {
                await queryRunner!.commitTransaction();
            }

            return savedQuotation;

        } catch (error) {
            if (shouldReleaseQueryRunner) {
                await queryRunner!.rollbackTransaction();
            }
            console.error('[QuotationService] Transaction compilation aborted:', error);
            throw error;
        } finally {
            if (shouldReleaseQueryRunner) {
                await queryRunner!.release();
            }
        }
    }


      async updateQuotation(
      targetId: number, 
      tenantId: number, 
      updatableFields: Partial<CreateQuotationDto>
  ): Promise<Quotation> {
      return await AppDataSource.transaction(async (transactionalEntityManager) => {
          const quotationRepo = transactionalEntityManager.getRepository(Quotation);
          const quotationItemRepo = transactionalEntityManager.getRepository(QuotationItem);
          const customerRepo = transactionalEntityManager.getRepository(Customer);

          if (updatableFields.clientId) {
              const targetCustomer = await customerRepo.findOne({
                  where: { id: updatableFields.clientId, tenantId }
              });
              if (!targetCustomer) {
                  throw new Error(`Customer ID ${updatableFields.clientId} does not exist under Tenant ID ${tenantId}.`);
              }
          }

          const existingQuotation = await quotationRepo.findOne({
              where: { id: targetId, tenantId },
              relations: ['items']
          });
     

        // --------------------------------------------------
        // 1. Get tenant quotation workflow strategy
        // --------------------------------------------------
             const tenantStrategyService =
            getTenantStrategyServiceRepository();

        const strategies =
            await tenantStrategyService.getTenantStrategies(tenantId);

        const quotationWorkflowStrategy =
            strategies.find(
                s => s.tenantStrategyName === 'Quotation_Workflow'
            );

        if (!quotationWorkflowStrategy) {
            throw new Error(
                `Quotation Workflow strategy is not configured for tenant ${tenantId}.`
            );
        }

        const workflowName =
            quotationWorkflowStrategy.tenantStrategy as QuotationWorkflowType;

            //---------------------------------------------------------------------------


          this.workflow.ensureCanEdit(workflowName,existingQuotation!.status);

          if (!existingQuotation) {
              throw new Error(`Quotation with identification ID ${targetId} missing on tenant context.`);
          }

          let aggregateTotal = existingQuotation.totalAmount;

          if (updatableFields.items) {
              await quotationItemRepo.delete({ quotationId: targetId });
              aggregateTotal = 0;


const productRepo = transactionalEntityManager.getRepository(Product);

            const freshlyMappedItems = await Promise.all(
    updatableFields.items.map(async (itemInput) => {

        //pending:remove cons log
        console.log('..itemInput...',itemInput);
        
        const itemNode = new QuotationItem();
        
        // Relational Links
        itemNode.productId = itemInput.productId ?? null;
        itemNode.productVariantId = itemInput.productVariantId ?? null;
        
        // Transactional Identifiers with Async DB Lookup
        let dynamicProdName = itemInput.prodName;

        if (!dynamicProdName && itemInput.productId) {
            const dbProduct = await productRepo.findOne({ where: { id: itemInput.productId } });
            if (dbProduct) {
                dynamicProdName = dbProduct.prodName; // assuming column name is 'name' in Product entity
            }
        }
        
        // Fallback cascade safety check
        itemNode.prodName = dynamicProdName || itemInput.description || 'Unknown Product';
        itemNode.sku = itemInput.sku ?? null;
        itemNode.description = itemInput.description || null;
        itemNode.unit = itemInput.unit;
        
        // Metrics
        itemNode.quantity = Number(itemInput.quantity || 0.00);
        itemNode.gstPercentage = Number(itemInput.gstPercentage || 0.00);
        itemNode.customPrice = Number(itemInput.customPrice || 0.00);

        itemNode.targetPrice = Number(itemInput.targetPrice || 0.00);

        itemNode.discount = Number(itemInput.discount || 0.00);
        itemNode.customAttributes = itemInput.customAttributes ?? null;

        const baseAmount = itemNode.quantity * itemNode.customPrice;
        const netAfterDiscount = baseAmount - itemNode.discount;
        const taxAmount = netAfterDiscount * (itemNode.gstPercentage / 100);
        
        itemNode.totalItemAmount = Number((netAfterDiscount + taxAmount).toFixed(2));
        aggregateTotal += itemNode.totalItemAmount;

        return itemNode;
    })
);


              existingQuotation.items = freshlyMappedItems;
          }

          const { items, ...pureFields } = updatableFields;
          pureFields.totalAmount = Number(aggregateTotal.toFixed(2));
          
          if (
            updatableFields.clientId &&
            updatableFields.clientId !== existingQuotation.clientId
            ) {
                this.workflow.ensureCanChangeCustomer(workflowName,existingQuotation.status);
              }

          quotationRepo.merge(existingQuotation, pureFields);

          return await quotationRepo.save(existingQuotation);
      });
  }


    // ==========================================
    // METHOD 1: UPDATE QUOTATION STATUS (SEND)
    // ==========================================
    // ==========================================
// METHOD 1: UPDATE QUOTATION STATUS (SEND)
// ==========================================
// ==========================================
// METHOD 1: UPDATE QUOTATION STATUS (SEND)
// ==========================================
async updateQuotationStatus(
    quoteId: number,
    tenantId: number,
    newStatus: QuotationStatus,
    manager?: EntityManager
): Promise<Quotation> {

    // If an outer transaction supplied a manager,
    // participate in that transaction.
    if (manager) {

        return await this.executeQuotationStatusUpdate(
            manager,
            quoteId,
            tenantId,
            newStatus
        );
    }


    // --------------------------------------------------
    // Create our own transaction
    // --------------------------------------------------

    const queryRunner =
        AppDataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {

        const updatedQuotation =
            await this.executeQuotationStatusUpdate(
                queryRunner.manager,
                quoteId,
                tenantId,
                newStatus
            );

        await queryRunner.commitTransaction();

        return updatedQuotation;

    } catch (error) {

        await queryRunner.rollbackTransaction();

        throw error;

    } finally {

        await queryRunner.release();
    }
}

// ==========================================
// EXECUTE QUOTATION STATUS UPDATE
// ==========================================
private async executeQuotationStatusUpdate(
    manager: EntityManager,
    quoteId: number,
    tenantId: number,
    newStatus: QuotationStatus
): Promise<Quotation> {

    const quotationRepo =
        manager.getRepository(Quotation);

    const rfqRepo =
        manager.getRepository(ClientRFQOrder);

    // --------------------------------------------------
    // 1. Load quotation
    // --------------------------------------------------

    const quotation =
        await quotationRepo.findOne({
            where: {
                id: quoteId,
                tenantId
            }
        });

    if (!quotation) {

        throw new Error(
            `[QuotationService] Quotation ${quoteId} not found.`
        );
    }

    // --------------------------------------------------
    // 2. Resolve quotation workflow
    // --------------------------------------------------

    const workflowType =
        await this.workflow.resolveWorkflowType(
            tenantId
        );

    // --------------------------------------------------
    // 3. Validate requested quotation transition
    // --------------------------------------------------

    if (newStatus === QuotationStatus.SENT) {

        this.workflow.ensureCanSend(
            workflowType,
            quotation.status
        );
    }

    // --------------------------------------------------
    // 4. Change quotation status
    // --------------------------------------------------

    console.log(
        `[QuotationService] Transitioning quotation ` +
        `${quotation.quoteNumber} ` +
        `from ${quotation.status} ` +
        `to ${newStatus}`
    );

    quotation.status =
        newStatus;

    // --------------------------------------------------
    // 5. Save quotation
    // --------------------------------------------------

    const savedQuotation =
        await quotationRepo.save(
            quotation
        );

    // --------------------------------------------------
    // 6. Synchronize originating RFQ
    // --------------------------------------------------
    //
    // Only RFQ-originated quotations participate.
    //
    // Manual quotations have:
    //
    // originatingClientRfqId = NULL
    //
    // Therefore they skip this section.
    // --------------------------------------------------

    if (
        newStatus === QuotationStatus.SENT &&
        savedQuotation.originatingClientRfqId
    ) {

        const rfq =
            await rfqRepo.findOne({
                where: {
                    id:
                        savedQuotation
                            .originatingClientRfqId,

                    tenantId
                }
            });

        if (!rfq) {

            throw new Error(
                `Originating Client RFQ ` +
                `${savedQuotation.originatingClientRfqId} ` +
                `was not found.`
            );
        }

        // --------------------------------------------------
        // RFQ should still be SUBMITTED here.
        //
        // It was converted earlier, but conversion itself
        // did not change the RFQ status.
        // --------------------------------------------------

        if (
            rfq.status !== RFQStatus.SUBMITTED
        ) {

            throw new Error(
                `Client RFQ ${rfq.clientRFQNumber} ` +
                `cannot be marked QUOTED because its ` +
                `current status is '${rfq.status}'.`
            );
        }

        // --------------------------------------------------
        // The quotation is now actually sent to client.
        // Therefore RFQ becomes QUOTED.
        // --------------------------------------------------

        rfq.status =
            RFQStatus.QUOTED;

        await rfqRepo.save(
            rfq
        );
    }

    // --------------------------------------------------
    // 7. Return complete quotation
    // --------------------------------------------------

    return await quotationRepo.findOneOrFail({
        where: {
            id: savedQuotation.id,
            tenantId
        },
        relations: [
            "client",
            "items",
            "items.product"
        ]
    });
}
    // ==========================================
    // METHOD 2: APPROVE QUOTATION (NO STOCK CHANGES)
    // ==========================================
    async approveQuotation(
        quoteId: number,
        tenantId: number,
        manager?: EntityManager
    ): Promise<Quotation> {
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
            const quoteRepo = activeManager.getRepository(Quotation);

            // 1. Fetch the target quotation with its items
            const targetQuote = await quoteRepo.findOne({
                where: { id: quoteId, tenantId },
                relations: ['items']
            });

            if (!targetQuote) {
                throw new Error(`[QuotationService] Quotation not found for ID: ${quoteId}`);
            }


        // --------------------------------------------------
        // 1. Get tenant quotation workflow strategy
        // --------------------------------------------------
             const tenantStrategyService =
            getTenantStrategyServiceRepository();

        const strategies =
            await tenantStrategyService.getTenantStrategies(tenantId);

        const quotationWorkflowStrategy =
            strategies.find(
                s => s.tenantStrategyName === 'Quotation_Workflow'
            );

        if (!quotationWorkflowStrategy) {
            throw new Error(
                `Quotation Workflow strategy is not configured for tenant ${tenantId}.`
            );
        }

        const workflowName =
            quotationWorkflowStrategy.tenantStrategy as QuotationWorkflowType;

            //---------------------------------------------------------------------------

            
            // 2. State Safety Guard
          this.workflow.ensureCanApprove(workflowName,targetQuote.status);

            console.log(`[QuotationService] Approving Quote ${targetQuote.quoteNumber}...`);

            // 3. Mutate status to APPROVED state safely inside the transaction
            targetQuote.status = QuotationStatus.APPROVED; 
            const approvedQuote = await quoteRepo.save(targetQuote);

            // 4. Stock Isolation Check
            // Explicitly skipping any stock alteration functions because quotation pipelines do not alter inventory balances.

            if (!isExternalTransaction && queryRunner) {
                await queryRunner.commitTransaction();
            }

            return approvedQuote;
        } catch (error) {
            if (!isExternalTransaction && queryRunner) await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            if (!isExternalTransaction && queryRunner) await queryRunner.release();
        }
    }



    /**
   * 🌟 PROCESS MULTI-ROUND NEGOTIATION FROM B2B PORTAL
   * Clones the previous quotation structure, increments iteration attributes, 
   * applies the TARGET price parameters, and marks old iterations inactive.
   */
     async processClientCounterOffer(
    originalQuoteId: number,
    tenantId: number,
    payload: any
): Promise<any> {

    return await AppDataSource.manager.transaction(
        async (transactionalEntityManager) => {

            // ============================================================
            // 1. Load existing quotation
            // ============================================================

            const existingQuote =
                await transactionalEntityManager.findOne(
                    Quotation,
                    {
                        where: {
                            id: originalQuoteId,
                            tenantId
                        },
                        relations: ['items']
                    }
                );

            if (!existingQuote) {
                throw new Error(
                    `Quotation structure source context matching ID #${originalQuoteId} not found for tenant #${tenantId}.`
                );
            }


            // ============================================================
            // 2. Resolve quotation workflow
            // ============================================================

            const quotationWorkflowType =
                await this.workflow.resolveWorkflowType(
                    tenantId
                );


            // ============================================================
            // 3. Validate quotation can receive counter offer
            // ============================================================

            this.workflow.ensureCanCounterOffer(
                quotationWorkflowType,
                existingQuote.status
            );


            // ============================================================
            // 4. If quotation originated from Client RFQ,
            //    load originating RFQ
            // ============================================================

            let originatingRFQ: ClientRFQOrder | null = null;

            if (existingQuote.originatingClientRfqId) {

                originatingRFQ =
                    await transactionalEntityManager.findOne(
                        ClientRFQOrder,
                        {
                            where: {
                                id: existingQuote.originatingClientRfqId,
                                tenantId
                            }
                        }
                    );

                if (!originatingRFQ) {
                    throw new Error(
                        `Originating Client RFQ #${existingQuote.originatingClientRfqId} was not found for tenant #${tenantId}.`
                    );
                }


                // ========================================================
                // 5. Resolve Client RFQ workflow
                // ========================================================

                const clientRFQWorkflowType =
                    await this.workflow_client.resolveWorkflowType(
                        tenantId
                    );


                // ========================================================
                // 6. Validate RFQ can move to IN_NEGOTIATION
                // ========================================================

                const canMoveToNegotiation =
                    this.workflow_client.ensureCanMoveToNegotiation(
                        clientRFQWorkflowType,
                        originatingRFQ.status
                    );

                if (!canMoveToNegotiation) {

                    throw new Error(
                        `Client RFQ #${originatingRFQ.id} cannot transition from '${originatingRFQ.status}' to '${RFQStatus.IN_NEGOTIATION}' under workflow '${clientRFQWorkflowType}'.`
                    );
                }
            }


            // ============================================================
            // 7. Archive previous quotation round
            // ============================================================

            existingQuote.isActive = false;

            await transactionalEntityManager.save(
                existingQuote
            );


            // ============================================================
            // 8. Create new negotiation quotation
            // ============================================================

            const newNegotiationRound =
                new Quotation();

            newNegotiationRound.tenantId =
                existingQuote.tenantId;

            newNegotiationRound.clientId =
                existingQuote.clientId;

            newNegotiationRound.clientName =
                existingQuote.clientName;

            newNegotiationRound.clientCategory =
                existingQuote.clientCategory;

            newNegotiationRound.contactPerson =
                existingQuote.contactPerson;

            newNegotiationRound.deliveryLocation =
                existingQuote.deliveryLocation;

            newNegotiationRound.remarksNotes =
                payload.remarksNotes ||
                existingQuote.remarksNotes;


            // ============================================================
            // Preserve originating RFQ relationship
            // ============================================================

            newNegotiationRound.originatingClientRfqId =
                existingQuote.originatingClientRfqId;

            newNegotiationRound.originatingClientRfqNumber =
                existingQuote.originatingClientRfqNumber;


            // ============================================================
            // Negotiation version
            // ============================================================

            newNegotiationRound.quoteNumber =
                existingQuote.quoteNumber
                    ? existingQuote.quoteNumber
                    : `QT-${Date.now()}`;

            newNegotiationRound.version =
                Number(existingQuote.version || 1) + 1;

            newNegotiationRound.isActive = true;

            newNegotiationRound.status =
                QuotationStatus.COUNTER_OFFERED;

            newNegotiationRound.totalAmount =
                Number(payload.totalAmount || 0);


            // ============================================================
            // 9. Save new quotation
            // ============================================================

            const savedRoundHeader =
                await transactionalEntityManager.save(
                    newNegotiationRound
                );


            // ============================================================
            // 10. Copy counter-offer items
            // ============================================================

            if (Array.isArray(payload.items)) {

                const structuralItemRows: QuotationItem[] = [];

                for (const incomingLine of payload.items) {

                    const itemRow =
                        new QuotationItem();

                    itemRow.quotation =
                        savedRoundHeader;


                    const resolvedProductId =
                        incomingLine.productId
                            ? Number(incomingLine.productId)
                            : null;

                    itemRow.productId =
                        resolvedProductId;

                    itemRow.productVariantId =
                        incomingLine.productVariantId
                            ? Number(
                                incomingLine.productVariantId
                            )
                            : null;


                    // ====================================================
                    // Product information fallback
                    // ====================================================

                    let finalProdName =
                        incomingLine.prodName;

                    let finalSku =
                        incomingLine.sku;


                    if (
                        !finalProdName &&
                        resolvedProductId &&
                        existingQuote.items
                    ) {

                        const historicalMatch =
                            existingQuote.items.find(
                                h =>
                                    Number(h.productId) ===
                                    resolvedProductId
                            );

                        if (historicalMatch) {

                            finalProdName =
                                historicalMatch.prodName;

                            finalSku =
                                historicalMatch.sku;
                        }
                    }


                    itemRow.prodName =
                        finalProdName ||
                        `Product #${resolvedProductId || 'Unknown'}`;

                    itemRow.sku =
                        finalSku || '';

                    itemRow.description =
                        incomingLine.description;

                    itemRow.unit =
                        incomingLine.unit || 'PCS';

                    itemRow.quantity =
                        Number(
                            incomingLine.quantity || 0
                        );

                    itemRow.customPrice =
                        Number(
                            incomingLine.price || 0
                        );

                    itemRow.targetPrice =
                        incomingLine.targetPrice
                            ? Number(
                                incomingLine.targetPrice
                            )
                            : null;

                    itemRow.discount =
                        Number(
                            incomingLine.discount || 0
                        );

                    itemRow.appliedLineDiscountId =
                        incomingLine.appliedLineDiscountId
                            ? Number(
                                incomingLine.appliedLineDiscountId
                            )
                            : null;

                    itemRow.gstPercentage =
                        Number(
                            incomingLine.gstPercentage || 0
                        );

                    itemRow.totalItemAmount =
                        Number(
                            incomingLine.totalItemAmount || 0
                        );


                    structuralItemRows.push(
                        itemRow
                    );
                }


                await transactionalEntityManager.save(
                    QuotationItem,
                    structuralItemRows
                );
            }


            // ============================================================
            // 11. Move originating RFQ into negotiation
            // ============================================================

            if (originatingRFQ) {

                originatingRFQ.status =
                    RFQStatus.IN_NEGOTIATION;

                await transactionalEntityManager.save(
                    ClientRFQOrder,
                    originatingRFQ
                );
            }


            // ============================================================
            // 12. Return newly created quotation
            // ============================================================

            return savedRoundHeader;
        }
    );
}

public async clientApproveQuotation(
    quotationId: number,
    tenantId: number
): Promise<Quotation> {

    const queryRunner =
        AppDataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {

        const manager =
            queryRunner.manager;


        // =====================================================
        // 1. Repositories
        // =====================================================

        const quotationRepo =
            manager.getRepository(
                Quotation
            );

        const rfqRepo =
            manager.getRepository(
                ClientRFQOrder
            );


        // =====================================================
        // 2. Fetch quotation
        // =====================================================

        const quotation =
            await quotationRepo.findOne({

                where: {
                    id: quotationId,
                    tenantId
                },

                relations: [
                    'items'
                ]

            });


        if (!quotation) {

            throw new Error(
                'Quotation not found or unauthorized.'
            );

        }


        // =====================================================
        // 3. Validate quotation status
        //
        // Client can accept only a quotation that has
        // already been sent by the wholesaler.
        // =====================================================

        if (
            quotation.status !==
            QuotationStatus.SENT
        ) {

            throw new Error(
                `Quotation cannot be accepted by client when status is '${quotation.status}'.`
            );

        }


        // =====================================================
        // 4. Resolve quotation workflow
        // =====================================================

        const workflowService =
            new QuotationWorkflowService();

        const workflowType =
            await workflowService.resolveWorkflowType(
                tenantId
            );


        // =====================================================
        // 5. Validate CLIENT_APPROVE transition
        // =====================================================

        workflowService.ensureCanClientApprove(
            workflowType,
            quotation.status
        );


        // =====================================================
        // 6. Update quotation
        //
        // SENT → CLIENT_APPROVED
        // =====================================================

        quotation.status =
            QuotationStatus.CLIENT_APPROVED;


        // =====================================================
        // 7. Find originating Client RFQ
        // =====================================================

        if (
            !quotation.originatingClientRfqId
        ) {

            throw new Error(
                'Quotation is not linked to an originating Client RFQ.'
            );

        }


        const rfq =
            await rfqRepo.findOne({

                where: {
                    id:
                        quotation.originatingClientRfqId,

                    tenantId
                }

            });


        if (!rfq) {

            throw new Error(
                'Originating Client RFQ not found.'
            );

        }


      


        // =====================================================
        // 9. Close originating RFQ
        //
        // IN_NEGOTIATION → CLOSED
        // =====================================================

        rfq.status =
            RFQStatus.CLOSED;


        // =====================================================
        // 10. Save RFQ
        // =====================================================

        await rfqRepo.save(
            rfq
        );


        // =====================================================
        // 11. Save quotation
        //
        // SENT → CLIENT_APPROVED
        // =====================================================

        const savedQuotation =
            await quotationRepo.save(
                quotation
            );


        // =====================================================
        // 12. Commit transaction
        //
        // Both changes succeed together.
        // =====================================================

        await queryRunner.commitTransaction();


        return savedQuotation;

    }
    catch (error: any) {

        await queryRunner.rollbackTransaction();

        console.error(
            '[Client Quotation Approval Rollback]:',
            error.message || error
        );

        throw error;

    }
    finally {

        await queryRunner.release();

    }

}

async processQuotationRevision(
    originalQuoteId: number,
    tenantId: number,
    payload: any
): Promise<Quotation> {

    return await AppDataSource.manager.transaction(
        async (transactionalEntityManager) => {

            // =========================================================
            // 1. Load existing quotation
            // =========================================================

            const quotationRepo =
                transactionalEntityManager.getRepository(Quotation);

            const quotationItemRepo =
                transactionalEntityManager.getRepository(QuotationItem);

            const rfqRepo =
                transactionalEntityManager.getRepository(ClientRFQOrder);

            const existingQuote =
                await quotationRepo.findOne({
                    where: {
                        id: originalQuoteId,
                        tenantId
                    },
                    relations: ['items']
                });

            if (!existingQuote) {
                throw new Error(
                    `Quotation #${originalQuoteId} not found for tenant #${tenantId}.`
                );
            }


            // =========================================================
            // 2. Resolve tenant quotation workflow
            // =========================================================

            const workflowType =
                await this.workflow.resolveWorkflowType(
                    tenantId
                );


            // =========================================================
            // 3. Workflow guardrail
            //
            // COUNTER_OFFERED → REVISED
            // =========================================================

            this.workflow.ensureCanRevise(
                workflowType,
                existingQuote.status
            );


            // =========================================================
            // 4. Archive previous quotation revision
            // =========================================================

            existingQuote.isActive = false;

            await transactionalEntityManager.save(
                Quotation,
                existingQuote
            );


            // =========================================================
            // 5. Create new quotation revision
            // =========================================================

            const revisedQuotation =
                quotationRepo.create({

                    tenantId:
                        existingQuote.tenantId,

                    clientId:
                        existingQuote.clientId,

                    clientName:
                        existingQuote.clientName,

                    clientCategory:
                        existingQuote.clientCategory,

                    contactPerson:
                        existingQuote.contactPerson,

                    deliveryLocation:
                        existingQuote.deliveryLocation,

                    remarksNotes:
                        payload.remarksNotes ??
                        existingQuote.remarksNotes,

                    quoteNumber:
                        existingQuote.quoteNumber,

                    version:
                        Number(existingQuote.version || 1) + 1,

                    isActive:
                        true,

                    status:
                        QuotationStatus.REVISED,

                    quotationDate:
                        new Date(),

                    originatingClientRfqId:
                        existingQuote.originatingClientRfqId,

                    originatingClientRfqNumber:
                        existingQuote.originatingClientRfqNumber,

                    totalAmount:
                        Number(
                            payload.totalAmount ??
                            existingQuote.totalAmount ??
                            0
                        )
                });


            const savedRevision =
                await quotationRepo.save(
                    revisedQuotation
                );


            // =========================================================
            // 6. Create revised quotation items
            // =========================================================

            const sourceItems =
                Array.isArray(payload.items) &&
                payload.items.length > 0

                    ? payload.items

                    : existingQuote.items;


            const revisedItems: QuotationItem[] = [];


            for (const sourceItem of sourceItems) {

                const item =
                    quotationItemRepo.create({

                        quotationId:
                            savedRevision.id,

                        productId:
                            sourceItem.productId
                                ? Number(sourceItem.productId)
                                : null,

                        productVariantId:
                            sourceItem.productVariantId
                                ? Number(sourceItem.productVariantId)
                                : null,

                        prodName:
                            sourceItem.prodName ||
                            `Product #${
                                sourceItem.productId ||
                                sourceItem.productVariantId ||
                                'Unknown'
                            }`,

                        sku:
                            sourceItem.sku || '',

                        description:
                            sourceItem.description || null,

                        unit:
                            sourceItem.unit || 'PCS',

                        quantity:
                            Number(
                                sourceItem.quantity || 0
                            ),

                        customPrice:
                            Number(
                                sourceItem.customPrice ??
                                sourceItem.price ??
                                0
                            ),

                        targetPrice:
                            sourceItem.targetPrice != null
                                ? Number(sourceItem.targetPrice)
                                : null,

                        discount:
                            Number(
                                sourceItem.discount || 0
                            ),

                        appliedLineDiscountId:
                            sourceItem.appliedLineDiscountId
                                ? Number(
                                    sourceItem.appliedLineDiscountId
                                )
                                : null,

                        gstPercentage:
                            Number(
                                sourceItem.gstPercentage || 0
                            ),

                        totalItemAmount:
                            Number(
                                sourceItem.totalItemAmount || 0
                            )
                    });


                revisedItems.push(item);
            }


            await quotationItemRepo.save(
                revisedItems
            );


            // =========================================================
            // 7. Synchronize originating Client RFQ
            //
            // COUNTER_OFFERED / REVISED means negotiation is active.
            // =========================================================

            if (existingQuote.originatingClientRfqId) {

                const rfq =
                    await rfqRepo.findOne({
                        where: {
                            id:
                                existingQuote.originatingClientRfqId,

                            tenantId
                        }
                    });


                if (!rfq) {

                    throw new Error(
                        `Originating Client RFQ #${
                            existingQuote.originatingClientRfqId
                        } not found.`
                    );
                }


                rfq.status =
                    RFQStatus.IN_NEGOTIATION;


                await rfqRepo.save(
                    rfq
                );
            }


            // =========================================================
            // 8. Reload complete revised quotation
            // =========================================================

            return await quotationRepo.findOneOrFail({

                where: {
                    id: savedRevision.id,
                    tenantId
                },

                relations: [
                    'client',
                    'items',
                    'items.product'
                ]

            });

        }
    );
}
// RFQ -> Quotation
async convertRFQToQuotation(
    tenantId: number,
    rfqId: number,
    userId: number
//): Promise<Quotation> {
){
    

const documentConversionEngine =   new DocumentConversionEngine();

    return AppDataSource.transaction(async manager => {

        return await documentConversionEngine
            .convertRFQToQuotation(
                manager,
                tenantId,
                rfqId,
                userId
            );

    });

}


}
