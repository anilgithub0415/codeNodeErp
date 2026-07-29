import { EntityManager, Repository } from 'typeorm';
import { AppDataSource } from '../../data-source'; 
import { Quotation, QuotationStatus } from '../entity/Quotation';
import { QuotationItem } from '../entity/QuotationItem';
import { Customer } from '../entity/Customer';
import { Product } from '../entity/Product';
import { LineDiscount } from '../entity/LineDiscount';

export interface ICreateQuotationItemInput {
    productId?: number | null;
    productVariantId?: number | null;
    prodName: string;
    sku?: string | null;
    description?: string | null;
    unit: string;
    quantity: number;
    gstPercentage: number;
    price: number;
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

export class QuotationService {
    private quotationRepository!: Repository<Quotation>;

    async init(repo: Repository<Quotation>): Promise<void> {
        this.quotationRepository = repo;
        console.log("QuotationService repository initialized.");       
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

            console.log('in getQuotations............isClientPortal:',isClientPortal);
            

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
        console.log('createDto for quotation initialized:', createDto);
        
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
                itemNode.price = Number(itemInput.price || 0.00);
                itemNode.discount = Number(itemInput.discount || 0.00);
                itemNode.customAttributes = itemInput.customAttributes ?? null;
                
                const baseAmount = itemNode.quantity * itemNode.price;
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
            const itemSubtotalBase = Number(item.price) * Number(item.quantity);
            const strategyLabel = activeDiscount.discountType ? activeDiscount.discountType.typeName : 'PERCENTAGE';

            if (strategyLabel === 'PERCENTAGE') {
                item.discount = itemSubtotalBase * (Number(activeDiscount.discountValue) / 100);
            } else if (strategyLabel === 'FIXED_AMOUNT') {
                item.discount = Number(activeDiscount.discountValue) * Number(item.quantity);
            }
        }
    }

    // Compute net totals using the individual 'item' variables context
    const rawGrossTotal = (Number(item.price) * Number(item.quantity)) - Number(item.discount);
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
        itemNode.price = Number(itemInput.price || 0.00);
        itemNode.discount = Number(itemInput.discount || 0.00);
        itemNode.customAttributes = itemInput.customAttributes ?? null;

        const baseAmount = itemNode.quantity * itemNode.price;
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
          
          quotationRepo.merge(existingQuotation, pureFields);

          return await quotationRepo.save(existingQuotation);
      });
  }


    // ==========================================
    // METHOD 1: UPDATE QUOTATION STATUS (SEND)
    // ==========================================
    async updateQuotationStatus(
        quoteId: number,
        tenantId: number,
        newStatus: QuotationStatus,
        manager?: EntityManager
    ): Promise<Quotation> {
        const activeManager = manager ? manager : AppDataSource.manager;
        const quoteRepo = activeManager.getRepository(Quotation);

        // 1. Fetch the target quotation
        const targetQuote = await quoteRepo.findOne({
            where: { id: quoteId, tenantId }
        });

        if (!targetQuote) {
            throw new Error(`[QuotationService] Quotation not found for ID: ${quoteId}`);
        }

        // 2. State Safety Guard
        // Allow transition to SENT only from DRAFT or REVISED states
        if (targetQuote.status !== QuotationStatus.DRAFT && targetQuote.status !== QuotationStatus.REVISED) {
            throw new Error(`[QuotationService] Only ${QuotationStatus.DRAFT} or ${QuotationStatus.REVISED} quotations can be sent. Current status is '${targetQuote.status}'.`);
        }

        console.log(`[QuotationService] Transitioning Quote ${targetQuote.quoteNumber} status from ${targetQuote.status} to ${newStatus}`);

        // 3. Mutate status cleanly
        targetQuote.status = newStatus;
        
        // 4. Save and return updated record
        return await quoteRepo.save(targetQuote);
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

            // 2. State Safety Guard
            // A quote can be approved if it is sent out or under review (REVISED)
            if (targetQuote.status !== QuotationStatus.SENT && targetQuote.status !== QuotationStatus.REVISED) {
                throw new Error(`[QuotationService] Cannot approve Quotation. Current status is '${targetQuote.status}', expected '${QuotationStatus.SENT}' or '${QuotationStatus.REVISED}'.`);
            }

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
      async processClientCounterOffer(originalQuoteId: number, tenantId: number, payload: any): Promise<any> {
    // 1. Execute atomic transaction wrapper using your custom AppDataSource architecture reference
    return await AppDataSource.manager.transaction(async (transactionalEntityManager) => {
      
      // 2. Fetch previous quotation instance with its linked material line items using transaction contexts
      const existingQuote = await transactionalEntityManager.findOne(Quotation, {
        where: { id: originalQuoteId, tenantId: tenantId },
        relations: ['items'],
      });

      if (!existingQuote) {
        throw new Error(`Quotation structure source context matching ID #${originalQuoteId} not found for tenant #${tenantId}.`);
      }

      // 3. Archive previous negotiation round iteration state safely
      existingQuote.isActive = false;
      await transactionalEntityManager.save(existingQuote);

      // 4. Create a clean instance model clone representing the target iteration change
      const newNegotiationRound = new Quotation();
      newNegotiationRound.tenantId = existingQuote.tenantId;
      newNegotiationRound.clientId = existingQuote.clientId;
      newNegotiationRound.clientName = existingQuote.clientName;
      newNegotiationRound.clientCategory = existingQuote.clientCategory;
      newNegotiationRound.contactPerson = existingQuote.contactPerson;
      newNegotiationRound.deliveryLocation = existingQuote.deliveryLocation;
      newNegotiationRound.remarksNotes = payload.remarksNotes || existingQuote.remarksNotes;
      
      // Seed multi-round version data attributes securely
      newNegotiationRound.quoteNumber = existingQuote.quoteNumber ? existingQuote.quoteNumber : `QT-${Date.now()}`;
      newNegotiationRound.version = Number(existingQuote.version || 1) + 1;
      newNegotiationRound.isActive = true;
      newNegotiationRound.status = QuotationStatus.COUNTER_OFFERED; // Moves client card automatically into Negotiation Kanban column
      newNegotiationRound.totalAmount = Number(payload.totalAmount || 0);

      // Persist top-level parent wrapper data to claim fresh sequence record index ID mappings
      const savedRoundHeader = await transactionalEntityManager.save(newNegotiationRound);

      // 5. Map line items incorporating client's targeted wholesale counter prices
      if (Array.isArray(payload.items)) {
        const structuralItemRows = [];

        for (const incomingLine of payload.items) {
          const itemRow = new QuotationItem();
          itemRow.quotation = savedRoundHeader;
          
          const resolvedProductId = incomingLine.productId ? Number(incomingLine.productId) : null;
          itemRow.productId = resolvedProductId;
          itemRow.productVariantId = incomingLine.productVariantId ? Number(incomingLine.productVariantId) : null;
          
          // 🌟 FIX: Fallback lookup directly against previous iteration lines if the frontend array dropped the parameter
          let finalProdName = incomingLine.prodName;
          let finalSku = incomingLine.sku;

          if (!finalProdName && resolvedProductId && existingQuote.items) {
            const historicalMatch = existingQuote.items.find(h => Number(h.productId) === resolvedProductId);
            if (historicalMatch) {
              finalProdName = historicalMatch.prodName;
              finalSku = historicalMatch.sku;
            }
          }

          // 🌟 SECONDARY SAFETY NET: Fallback string value to guarantee compliance with database schema rules
          itemRow.prodName = finalProdName || `Product #${resolvedProductId || 'Unknown'}`;
          itemRow.sku = finalSku || '';
          
          itemRow.description = incomingLine.description;
          itemRow.unit = incomingLine.unit || 'PCS';
          itemRow.quantity = Number(incomingLine.quantity || 0);
          
          // Track both core wholesale value and newly requested target metrics
          itemRow.price = Number(incomingLine.price || 0);
         itemRow.targetPrice = incomingLine.targetPrice ? Number(incomingLine.targetPrice) : null;
          
          itemRow.discount = Number(incomingLine.discount || 0);
          itemRow.appliedLineDiscountId = incomingLine.appliedLineDiscountId ? Number(incomingLine.appliedLineDiscountId) : null;
          itemRow.gstPercentage = Number(incomingLine.gstPercentage || 0);
          itemRow.totalItemAmount = Number(incomingLine.totalItemAmount || 0);
          
          structuralItemRows.push(itemRow);
        }

        // Batch persist the item lines within the transactional scope
        await transactionalEntityManager.save(QuotationItem, structuralItemRows);
      }

      // Return the newly created revision record, committing the transaction automatically
      return savedRoundHeader;
    });
  }





}
