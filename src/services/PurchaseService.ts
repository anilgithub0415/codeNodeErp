
import { EntityManager, Not, Repository } from 'typeorm';

import { AppDataSource } from '../../data-source'; 
import { PurchaseOrder } from '../entity/PurchaseOrder';
import {PurchaseOrderItem} from '../entity/PurchaseOrderItem'
import { Product } from '../entity/Product';
import { DocumentSequence } from '../entity/DocumentSequence';
import { ProductVariant } from '../entity/productVariant';
import { ProductUomConversion } from '../entity/ProductUomConversion';
import { getProductRepository, getProductUomConversionRepository, getProductVariantRepository } from '../dependencies';

export interface ICreatePurchaseOrderItemInput {
    productId?: number;
    productVariantId?: number;
    quantity: number;
    unitPrice?: number;
    price?: number;
    purchaseUom?: string; // Optional: If empty, code will look up the product default!
}

interface CreatePurchaseOrderDto{
    tenantId:number;
    
    createdByUserId?:number;
    items: ICreatePurchaseOrderItemInput[]; 
    [key:string]:any;
}

export interface CreatedPurchaseOrderResponse {
    purchaseOrder: PurchaseOrder;
  
}
export class PurchaseService{

 private purchaseRepository!: Repository<PurchaseOrder>;

 //============================================================================================================================================
     /**
         * Initializes the PurchaseService with its TypeORM repository instances.
         * This MUST be called AFTER AppDataSource.initialize() has completed.
         * @param purchaseRepo The TypeORM Repository instance for Purchase.
         */
        async init(purchaseRepo: Repository<PurchaseOrder>
    ): Promise<void> {
            this.purchaseRepository = purchaseRepo;
           
                console.log("PurchaseService repository initialized.");       
        }
//============================================================================================================================================




//============================================================================================================================================
        async createPurchaseOrder(
    createDto: CreatePurchaseOrderDto,
    manager?: EntityManager
): Promise<CreatedPurchaseOrderResponse> {
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

        const poRepo = activeManager.getRepository(PurchaseOrder);
        const poiRepo = activeManager.getRepository(PurchaseOrderItem);
        const productRepo = activeManager.getRepository(Product);
        const variantRepo = activeManager.getRepository(ProductVariant);

        let targetOrder: PurchaseOrder;

        // Check if the purchase order already exists under this tenant
        let existingPo = await poRepo.findOne({ 
            where: { 
                tenantId: createDto.tenantId, 
                poNumber: createDto.poNumber,
                //vendorId: createDto.vendorId
            } 
        });
        
        // --- ENRICH & VALIDATE LINE ITEMS (WITH AUTOMATED UOM FALLBACK) ---
        const enrichedItems: PurchaseOrderItem[] = [];
        
        for (const itemInput of (createDto.items || [])) {
            const poi = new PurchaseOrderItem();
            poi.quantity = Number(itemInput.quantity || 0);
            poi.finalPrice = Number(itemInput.unitPrice || itemInput.price || 0.00);

            let chosenUom = itemInput.purchaseUom?.trim();

            // Pathway A: Flat Product
            if (itemInput.productId && !itemInput.productVariantId) {
                const product = await productRepo.findOne({ 
                    where: { id: itemInput.productId, tenantId: createDto.tenantId } 
                });
                if (!product) throw new Error(`Product ID ${itemInput.productId} not found.`);

                // AUTOMATION FALLBACK RULE: Fallback to master default if payload is empty
                if (!chosenUom) {
                    chosenUom = product.defaultPurchaseUom || product.baseUom;
                }

                poi.productId = product.id;
                poi.productVariantId = null; 
                poi.prodName = product.prodName;
                poi.sku = product.sku;
                (poi as any).purchaseUom = chosenUom; // Attach tracking descriptor string dynamically

            // Pathway B: Variant Template
            } else if (itemInput.productVariantId && !itemInput.productId) {
                const variant = await variantRepo.findOne({
                    where: { id: itemInput.productVariantId },
                    relations: ['productTemplate']
                });
                if (!variant || variant.productTemplate.tenantId !== createDto.tenantId) {
                    throw new Error(`Variant ID ${itemInput.productVariantId} not found.`);
                }

                // AUTOMATION FALLBACK RULE: Pull down default configurations from parent series template
                if (!chosenUom) {
                    chosenUom = variant.productTemplate.defaultPurchaseUom || variant.productTemplate.baseUom;
                }

                poi.productId = null;
                poi.productVariantId = variant.id;
                
                const sizeStr = variant.size ? ` (${variant.size})` : '';
                const finishStr = variant.finish ? ` - ${variant.finish}` : '';
                poi.prodName = `${variant.productTemplate.prodName}${sizeStr}${finishStr}`;
                poi.sku = variant.sku;
                (poi as any).purchaseUom = chosenUom;

            } else {
                throw new Error("Invalid purchase item format. Provide exactly one: productId OR productVariantId.");
            }

            enrichedItems.push(poi);
        }

        // --- EXECUTE WRITE OPERATIONS ---
        if (existingPo) {
            console.log(`Found existing Purchase Order: ${existingPo.poNumber}, performing update.`);
            
            const oldItems = await poiRepo.find({ where: { purchaseOrderId: existingPo.id } });
            await poiRepo.delete({ purchaseOrderId: existingPo.id });

            const { poNumber, ...updateData } = createDto;
            poRepo.merge(existingPo, updateData);  
            existingPo.items = enrichedItems;
            targetOrder = await poRepo.save(existingPo);

            // Re-runs adjustments utilizing safe calculated fallbacks
            await this.adjustPurchaseStockDelta(activeManager, createDto.tenantId, oldItems, enrichedItems);
            
        } else {
            console.log('Generating autonumbering...');
            const generatedPONumber = await this.generatePurchaseOrderNumber(activeManager, 'STANDARD');
            createDto.poNumber = generatedPONumber;

            console.log(`Creating fresh Purchase Order: ${createDto.poNumber}`);
            const newPO = poRepo.create(createDto);
            newPO.items = enrichedItems;
            
            targetOrder = await poRepo.save(newPO);

            // Direct stock increment applying standard conversions
            await this.incrementProductStock(activeManager, createDto.tenantId, enrichedItems);
        }

        if (!isExternalTransaction && queryRunner) {
            await queryRunner.commitTransaction();
        }

        return { purchaseOrder: targetOrder };

    } catch (error) {
        if (!isExternalTransaction && queryRunner) {
            await queryRunner.rollbackTransaction();
        }
        console.error('Error in createPurchaseOrder:', error);
        throw error;
    } finally {
        if (!isExternalTransaction && queryRunner) {
            await queryRunner.release();
        }
    }
}
//============================================================================================================================================

//---xyz---
/**
 * Strict POST Action: Asserts validation rules, checks duplicate entries, 
 * computes autonumbering metrics, and generates a fresh Purchase Order transaction.
 */
async createPurchaseOrderClean(
    createDto: CreatePurchaseOrderDto,
    manager?: EntityManager
): Promise<PurchaseOrder> {
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

        const poRepo = activeManager.getRepository(PurchaseOrder);
        const productRepo = activeManager.getRepository(Product);
        const variantRepo = activeManager.getRepository(ProductVariant);

        // ❌ Safety Block: Ensure no custom client-side sequential ID injection
        const { id, ...cleanDto } = createDto;

        // Generate a real sequence transaction block using pessimistic row locking
        const generatedPONumber = await this.generatePurchaseOrderNumber(activeManager, 'STANDARD');
        cleanDto.poNumber = generatedPONumber;

        const enrichedItems = await this.enrichAndValidateLineItems(cleanDto.items, cleanDto.tenantId, productRepo, variantRepo);

        console.log(`[PurchaseService] Creating new unique Purchase Order: ${cleanDto.poNumber}`);
        const newPO = poRepo.create(cleanDto);
        newPO.items = enrichedItems;
        
        const targetOrder = await poRepo.save(newPO);

        // Directly increment real-time stock balances across standard conversion parameters
        await this.incrementProductStock(activeManager, cleanDto.tenantId, enrichedItems);

        if (!isExternalTransaction && queryRunner) {
            await queryRunner.commitTransaction();
        }

        return targetOrder;
    } catch (error) {
        if (!isExternalTransaction && queryRunner) await queryRunner.rollbackTransaction();
        throw error;
    } finally {
        if (!isExternalTransaction && queryRunner) await queryRunner.release();
    }
}

/**
 * Strict PUT Action: Overwrites editable transactional header metrics, purges historic item 
 * lines safely, and runs precise inventory stock delta calculations to prevent ledger leaking.
 */
async updatePurchaseOrder(
    id: number,
    tenantId: number,
    updateDto: Partial<CreatePurchaseOrderDto>,
    manager?: EntityManager
): Promise<PurchaseOrder> {
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

        const poRepo = activeManager.getRepository(PurchaseOrder);
        const poiRepo = activeManager.getRepository(PurchaseOrderItem);
        const productRepo = activeManager.getRepository(Product);
        const variantRepo = activeManager.getRepository(ProductVariant);

        // 🔒 Multi-Tenant Boundary: Prevent non-authorized updating operations across business spaces
        const existingPo = await poRepo.findOne({ where: { id, tenantId } });
        if (!existingPo) throw new Error("Purchase Order record not found or unauthorized cross-tenant write.");

        // Check if PO state machine allows updates (Example guardrail)
        if (existingPo.status === 'APPROVED' || existingPo.status === 'CLOSED') {
            throw new Error(`Cannot modify a Purchase Order with status: ${existingPo.status}`);
        }

        const oldItems = await poiRepo.find({ where: { purchaseOrderId: existingPo.id } });
        const enrichedItems = await this.enrichAndValidateLineItems(updateDto.items || [], tenantId, productRepo, variantRepo);

        // Atomically delete and regenerate lines to satisfy TypeORM identity configurations
        await poiRepo.delete({ purchaseOrderId: existingPo.id });

        const { id: payloadId, tenantId: payloadTenantId, poNumber, ...updatableFields } = updateDto;
        poRepo.merge(existingPo, updatableFields);  
        existingPo.items = enrichedItems;
        
        const targetOrder = await poRepo.save(existingPo);

        // Re-run delta computation variables tracking historical factors
        await this.adjustPurchaseStockDelta(activeManager, tenantId, oldItems, enrichedItems);

        if (!isExternalTransaction && queryRunner) {
            await queryRunner.commitTransaction();
        }

        return targetOrder;
    } catch (error) {
        if (!isExternalTransaction && queryRunner) await queryRunner.rollbackTransaction();
        throw error;
    } finally {
        if (!isExternalTransaction && queryRunner) await queryRunner.release();
    }
}

/**
 * Isolated logic block to map item validation workflows safely
 */
private async enrichAndValidateLineItems(
    itemsInput: ICreatePurchaseOrderItemInput[],
    tenantId: number,
    productRepo: any,
    variantRepo: any
): Promise<PurchaseOrderItem[]> {
    const enrichedItems: PurchaseOrderItem[] = [];
    
    for (const itemInput of itemsInput) {
        const poi = new PurchaseOrderItem();
        poi.quantity = Number(itemInput.quantity || 0);
        poi.finalPrice = Number(itemInput.unitPrice || itemInput.price || 0.00);
        let chosenUom = itemInput.purchaseUom?.trim();

        if (itemInput.productId && !itemInput.productVariantId) {
            const product = await productRepo.findOne({ where: { id: itemInput.productId, tenantId } });
            if (!product) throw new Error(`Product ID ${itemInput.productId} not found.`);

            if (!chosenUom) chosenUom = product.defaultPurchaseUom || product.baseUom;

            poi.productId = product.id;
            poi.productVariantId = null; 
            poi.prodName = product.prodName;
            poi.sku = product.sku;
            poi.purchaseUom = chosenUom!;

        } else if (itemInput.productVariantId && !itemInput.productId) {
            const variant = await variantRepo.findOne({ where: { id: itemInput.productVariantId }, relations: ['productTemplate'] });
            if (!variant || variant.productTemplate.tenantId !== tenantId) {
                throw new Error(`Variant ID ${itemInput.productVariantId} not found.`);
            }

            if (!chosenUom) chosenUom = variant.productTemplate.defaultPurchaseUom || variant.productTemplate.baseUom;

            poi.productId = null;
            poi.productVariantId = variant.id;
            const sizeStr = variant.size ? ` (${variant.size})` : '';
            const finishStr = variant.finish ? ` - ${variant.finish}` : '';
            poi.prodName = `${variant.productTemplate.prodName}${sizeStr}${finishStr}`;
            poi.sku = variant.sku;
            poi.purchaseUom = chosenUom!;
        } else {
            throw new Error("Invalid purchase item format. Provide exactly one: productId OR productVariantId.");
        }
        enrichedItems.push(poi);
    }
    return enrichedItems;
}


//============================================================================================================================================
private async adjustPurchaseStockDelta(
    txManager: EntityManager,
    tenantId: number,
    oldItems: PurchaseOrderItem[],
    newItems: PurchaseOrderItem[]
): Promise<void> {
    const productRepo = txManager.getRepository(Product);
    const variantRepo = txManager.getRepository(ProductVariant);

    // Key: "entityId_uom", Value: Total Quantity converted into Base Inventory Tracking Units
    const oldFlatMap = new Map<string, number>();
    const oldVariantMap = new Map<string, number>();

    const buildItemKey = (id: number, uom: string) => `${id}_${uom.toLowerCase().trim()}`;

    // 1. Calculate historical stock units previously added to stock
    for (const item of oldItems) {
        const pid = item.productId ? Number(item.productId) : null;
        const vid = item.productVariantId ? Number(item.productVariantId) : null;
        const oldQty = Number(item.quantity || 0);
        if ((!pid && !vid) || oldQty === 0) continue;

        // Fetch product's intrinsic base unit
        let inventoryTrackingUom = 'PCS';
        if (pid) {
            const prod = await productRepo.findOne({ where: { id: pid }, select: ['baseUom'] }); // 🌟 Updated to baseUom
            if (prod) inventoryTrackingUom = prod.baseUom;
        } else if (vid) {
            const variant = await variantRepo.findOne({ where: { id: vid }, select: ['baseUom'] }); // 🌟 Updated to baseUom
            if (variant) inventoryTrackingUom = variant.baseUom;
        }

        let factor = 1.0000;
        const incomingOldUom = item.purchaseUom || inventoryTrackingUom;

        if (incomingOldUom.toLowerCase() !== inventoryTrackingUom.toLowerCase()) {
            factor = await this.getConversionFactor(txManager, tenantId, pid, vid, incomingOldUom);
        }

        const oldSaleUnitsQty = oldQty * factor;
        const compoundKey = buildItemKey(pid || vid!, incomingOldUom);

        if (pid) {
            const currentQty = oldFlatMap.get(compoundKey) || 0;
            oldFlatMap.set(compoundKey, currentQty + oldSaleUnitsQty);
        } else if (vid) {
            const currentQty = oldVariantMap.get(compoundKey) || 0;
            oldVariantMap.set(compoundKey, currentQty + oldSaleUnitsQty);
        }
    }

    // 2. Loop through the new items and apply delta adjustments
    for (const newItem of newItems) {
        const pid = newItem.productId ? Number(newItem.productId) : null;
        const vid = newItem.productVariantId ? Number(newItem.productVariantId) : null;
        const newQty = Number(newItem.quantity || 0);
        if ((!pid && !vid) || newQty === 0) continue;

        // Fetch product's intrinsic base unit
        let inventoryTrackingUom = 'PCS';
        if (pid) {
            const prod = await productRepo.findOne({ where: { id: pid }, select: ['baseUom'] }); // 🌟 Updated to baseUom
            if (prod) inventoryTrackingUom = prod.baseUom;
        } else if (vid) {
            const variant = await variantRepo.findOne({ where: { id: vid }, select: ['baseUom'] }); // 🌟 Updated to baseUom
            if (variant) inventoryTrackingUom = variant.baseUom;
        }

        let factor = 1.0000;
        const incomingNewUom = newItem.purchaseUom || inventoryTrackingUom;

        if (incomingNewUom.toLowerCase() !== inventoryTrackingUom.toLowerCase()) {
            factor = await this.getConversionFactor(txManager, tenantId, pid, vid, incomingNewUom);
        }

        const newSaleUnitsQty = newQty * factor;
        const currentCompoundKey = buildItemKey(pid || vid!, incomingNewUom);

        // --- TRACK FLAT PRODUCTS ---
        if (pid) {
            const oldSaleUnitsQty = oldFlatMap.get(currentCompoundKey) || 0;
            const diff = newSaleUnitsQty - oldSaleUnitsQty;

            if (diff > 0) {
                console.log(`Product ID ${pid}: Increasing purchase stock delta by +${diff} ${inventoryTrackingUom}.`);
                await productRepo.increment({ id: pid }, 'currentstock', diff);
            } else if (diff < 0) {
                console.log(`Product ID ${pid}: Decreasing purchase stock delta by ${diff} ${inventoryTrackingUom}.`);
                await productRepo.decrement({ id: pid }, 'currentstock', Math.abs(diff));
            }
            
            oldFlatMap.delete(currentCompoundKey);

        // --- TRACK PRODUCT VARIANTS ---
        } else if (vid) {
            const oldSaleUnitsQty = oldVariantMap.get(currentCompoundKey) || 0;
            const diff = newSaleUnitsQty - oldSaleUnitsQty;

            if (diff > 0) {
                console.log(`Variant ID ${vid}: Increasing purchase stock delta by +${diff} ${inventoryTrackingUom}.`);
                await variantRepo.increment({ id: vid }, 'currentstock', diff);
            } else if (diff < 0) {
                console.log(`Variant ID ${vid}: Decreasing purchase stock delta by ${diff} ${inventoryTrackingUom}.`);
                await variantRepo.decrement({ id: vid }, 'currentstock', Math.abs(diff));
            }
            
            oldVariantMap.delete(currentCompoundKey);
        }
    }

    // 3. Subtract remaining items completely removed from the payload
    for (const [flatKey, removedSaleQty] of oldFlatMap.entries()) {
        if (removedSaleQty > 0) {
            const flatId = Number(flatKey.split('_')[0]);
            console.log(`Product ID ${flatId} removed from PO line item. Reverting -${removedSaleQty} stock units.`);
            await productRepo.decrement({ id: flatId }, 'currentstock', removedSaleQty);
        }
    }

    for (const [variantKey, removedSaleQty] of oldVariantMap.entries()) {
        if (removedSaleQty > 0) {
            const variantId = Number(variantKey.split('_')[0]);
            console.log(`Variant ID ${variantId} removed from PO line item. Reverting -${removedSaleQty} stock units.`);
            await variantRepo.decrement({ id: variantId }, 'currentstock', removedSaleQty);
        }
    }
}


//============================================================================================================================================



//============================================================================================================================================
// FIX 3: Rewritten to split inventory between Product vs ProductVariant tables
private async incrementProductStock(
    txManager: EntityManager,
    tenantId: number,
    items: PurchaseOrderItem[]
): Promise<void> {
    const productRepo = txManager.getRepository(Product);
    const variantRepo = txManager.getRepository(ProductVariant);

    for (const it of items) {
        const purchaseQty = Number(it.quantity || 0);
        if (purchaseQty === 0) continue;

        let inventoryTrackingUom = 'PCS';
        let repoToUpdate: typeof productRepo | typeof variantRepo;
        let lookupCriteria: { id: number };

        // 1. Fetch the target record to read its exact tracking unit (baseUom)
        if (it.productId) {
            const product = await productRepo.findOne({ 
                where: { id: it.productId }, 
                select: ['id', 'baseUom'] // 🌟 Updated from stockUom to baseUom
            });
            if (!product) throw new Error(`Product ID ${it.productId} not found.`);
            
            inventoryTrackingUom = product.baseUom;
            repoToUpdate = productRepo;
            lookupCriteria = { id: it.productId };
        } else if (it.productVariantId) {
            const variant = await variantRepo.findOne({ 
                where: { id: it.productVariantId }, 
                select: ['id', 'baseUom'] // 🌟 Updated from stockUom to baseUom
            });
            if (!variant) throw new Error(`Variant ID ${it.productVariantId} not found.`);
            
            inventoryTrackingUom = variant.baseUom;
            repoToUpdate = variantRepo;
            lookupCriteria = { id: it.productVariantId };
        } else {
            continue; // Skip if item references neither product nor variant
        }

        // 2. Resolve conversion factor based on unit matching
        let factor = 1.0000;
        const incomingUom = it.purchaseUom || inventoryTrackingUom;

        if (incomingUom.toLowerCase() !== inventoryTrackingUom.toLowerCase()) {
            factor = await this.getConversionFactor(
                txManager, 
                tenantId, 
                it.productId, 
                it.productVariantId, 
                incomingUom
            );
        }

        // 3. Compute target quantities and increment inventory balance
        const targetStockQty = purchaseQty * factor;

        console.log(
            `Incrementing Stock [ID: ${lookupCriteria.id}]: Adding +${targetStockQty} ${inventoryTrackingUom} ` +
            `(Converted from ${purchaseQty} "${incomingUom}" via factor ${factor})`
        );

        await repoToUpdate.increment(lookupCriteria, 'currentstock', targetStockQty);
    }
}

//============================================================================================================================================



//============================================================================================================================================
private async getConversionFactor(
    txManager: EntityManager,
    tenantId: number,
    productId: number | null,
    productVariantId: number | null,
    purchaseUom?: string
): Promise<number> {
    // If no specific unit is passed, assume a 1:1 base unit calculation fallback
    if (!purchaseUom || purchaseUom.trim() === '') {
        return 1.0000;
    }

    const conversionRepo = txManager.getRepository(ProductUomConversion);
    
    // Look up the conversion rule strictly isolated by tenant and product type
    const conversion = await conversionRepo.findOne({
        where: {
            tenantId: tenantId,
            productId: productId ?? undefined,          // TypeORM ignores undefined properties in where clauses
            productVariantId: productVariantId ?? undefined,
            purchaseUom: purchaseUom.trim()
        }
    });

    if (conversion) {
        return Number(conversion.conversionFactor);
    }

    // Dynamic Log Warning: Help developers track down missing setups in the ERP backend
    console.warn(
        `[UOM Warning] No conversion rule found for Tenant: ${tenantId}, ` +
        `Product: ${productId || 'N/A'}, Variant: ${productVariantId || 'N/A'}, ` +
        `UOM: "${purchaseUom}". Defaulting to factor 1.0000.`
    );

    return 1.0000;
}
//============================================================================================================================================




//============================================================================================================================================
      /* ---------------------------------------------------------
         GET SINLGE PO FOR TENANT – unchanged
         --------------------------------------------------------- */
      async getPO(
        tenantId: number,poId:number,
        manager?: EntityManager
      ): Promise<PurchaseOrder[]> {
        if (!this.purchaseRepository) {
          throw new Error(
            'PurchaseService repository not initialized. Call init() first.'
          );
        }
    
        const repo = manager
          ? manager.getRepository(PurchaseOrder)
          : this.purchaseRepository;
    
        const pos = await repo.find({ where: { tenantId , id:poId } ,relations:{items:true} });
      
        return pos;
      }
      //============================================================================================================================================

       
//============================================================================================================================================
      /* ---------------------------------------------------------
         GET ALL POs FOR TENANT – unchanged
         --------------------------------------------------------- */
      async getPOs(
        tenantId: number,
        manager?: EntityManager
      ): Promise<PurchaseOrder[]> {
        if (!this.purchaseRepository) {
          throw new Error(
            'PurchaseService repository not initialized. Call init() first.'
          );
        }
    
        const repo = manager
          ? manager.getRepository(PurchaseOrder)
          : this.purchaseRepository;
    
        const pos = await repo.find({ where: { tenantId } ,relations:{items:true} });
      
        return pos;
      }
      //============================================================================================================================================




//============================================================================================================================================
          public async generatePurchaseOrderNumber(
          transactionalEntityManager: EntityManager, 
          channelCode: string = "W"
      ): Promise<string> {
          console.log('--- START: generatePurchaseOrderNumber ---');
          
          try {
              const now = new Date();
              const yearMonth = `${now.getFullYear().toString().slice(-2)}${(now.getMonth() + 1).toString().padStart(2, '0')}`;
              const docType = "Purchase_ORDER";
              
              console.log(`Searching sequence for DocType: ${docType}, YearMonth: ${yearMonth}`);
      
              // 1. Fetch sequence entry with an exclusive row lock
              console.log('Executing database query with pessimistic_write lock...');
              let sequence = await transactionalEntityManager
                  .getRepository(DocumentSequence)
                  .createQueryBuilder("seq")
                  .setLock("pessimistic_write") 
                  .where("seq.documentType = :docType AND seq.prefixYearMonth = :yearMonth", { docType, yearMonth })
                  .getOne();
              
              console.log('Database query finished. Sequence found:', !!sequence);
      
              let nextValue: number;
      
              if (!sequence) {
                  nextValue = 100001;
                  console.log(`No sequence found. Initializing new row with value: ${nextValue}`);
                  
                  const newSequence = new DocumentSequence();
                  newSequence.documentType = docType;
                  newSequence.prefixYearMonth = yearMonth;
                  newSequence.currentValue = nextValue;
      
                  await transactionalEntityManager.save(DocumentSequence, newSequence);
                  console.log('New sequence record saved successfully.');
              } else {
                  nextValue = sequence.currentValue + 1;
                  console.log(`Sequence found. Incrementing value to: ${nextValue}`);
                  sequence.currentValue = nextValue;
                  
                  await transactionalEntityManager.save(DocumentSequence, sequence);
                  console.log('Existing sequence record updated successfully.');
              }
      
              const finalPO = `PO-${yearMonth}-${channelCode.toUpperCase()}-${nextValue}`;
              console.log(`--- END: Generated PO Number successfully: ${finalPO} ---`);
              return finalPO;
      
          } catch (error:any) {
              console.error('--- ERROR in generateClientPurchaseOrderNumber ---');
              console.error('Message:', error.message);
              console.error('Stack Trace:', error.stack);
              // Rethrow the error so the outer database transaction knows to ROLLBACK
              throw error; 
          }
      }
      //============================================================================================================================================

    
//============================================================================================================================================
      //for dealing units--------------------------------------------------------------------
      async fetchTenantRulesMatrix(
  tenantId: number,
  productId: number | null,
  productVariantId: number | null
): Promise<any> {
  console.log(`Processing UOM layout for Tenant: ${tenantId}. Product: ${productId}, Variant: ${productVariantId}`);

  let activeBaseUom = 'PCS'; 
  let conversionRules: ProductUomConversion[] = [];

  // --- CASE A: TENANT USES VARIANT PRODUCT MODELS ---
  if (  productVariantId ) {
    // 1. Fetch conversion rules array using your dedicated custom UOM Conversion service
    // 🌟 FIX: Call the service getter directly, provide arguments, and look up by productVariantId
    conversionRules = await getProductUomConversionRepository()
      .getProductUomConversion(tenantId,null, productVariantId);

    // 2. Extract base unit tracking upwards through the variant template service
    // 🌟 FIX: Await the response from your service lookup method
    const variantRecord = await getProductVariantRepository()
      .getProductVariant(tenantId, productVariantId!);
      
    if (variantRecord?.productTemplate) {
      activeBaseUom = variantRecord.productTemplate.baseUom;
    }
  } 
  // --- CASE B: TENANT USES FLAT PRODUCT MODELS ---
  else if (productId) {
    // 1. Fetch conversions matching this specific Flat Product ID
    // 🌟 FIX: Await the custom conversion matrix array using productId context
    conversionRules = await getProductUomConversionRepository()
      .getProductUomConversion(tenantId, productId,null);

    // 2. Extract base unit configuration directly from your product service
    // 🌟 FIX: Brought inside the conditional block and properly awaited to prevent execution race conditions
    const productRecord = await getProductRepository()
      .getProduct(tenantId, productId);
    
    if (productRecord) {
      activeBaseUom = productRecord.baseUom;
    }
  }

  // --- STEP 3: CONSOLIDATE & UNIFY AVAILABLE SELECTION UNITS ---
 // --- STEP 3: CONSOLIDATE & UNIFY AVAILABLE PURCHASE UNITS ---
const structuredUnits = conversionRules.map(rule => ({
  label: `${rule.purchaseUom} (x${Number(rule.conversionFactor).toFixed(2)})`,
  value: rule.purchaseUom,
  factor: Number(rule.conversionFactor),
  targetSaleUom: rule.saleUom
}));

// 🌟 FIX: Filter the mapped array to ensure 'value' (e.g., 'BOX') is unique
const uniquePurchaseUnits = structuredUnits.filter((unit, index, self) =>
  index === self.findIndex((u) => u.value.toLowerCase() === unit.value.toLowerCase())
);

const hasBaseUnit = uniquePurchaseUnits.some(u => u.value.toLowerCase() === activeBaseUom.toLowerCase());

if (!hasBaseUnit) {
  uniquePurchaseUnits.unshift({
    label: `${activeBaseUom} (Baseline)`,
    value: activeBaseUom,
    factor: 1.0000,
    targetSaleUom: activeBaseUom
  });
}

return {
  baseInventoryUom: activeBaseUom,
  availablePurchaseUnits: uniquePurchaseUnits // Returns a distinct, clean array
};

}

 //end for dealing with units------------------------
//===========================================================================================


    }

export default PurchaseService