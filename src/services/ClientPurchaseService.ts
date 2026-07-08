
import { EntityManager, Not, Repository } from 'typeorm';

import { AppDataSource } from '../../data-source'; 
import { ClientPurchaseOrder } from '../entity/ClientPurchaseOrder';
import {ClientPurchaseOrderItem} from '../entity/ClientPurchaseOrderItem'
import { Product } from '../entity/Product';
import { DocumentSequence } from '../entity/DocumentSequence';
import { ProductVariant } from '../entity/productVariant';
import { ProductUomConversion } from '../entity/ProductUomConversion';
import { getProductRepository, getProductUomConversionRepository, getProductVariantRepository } from '../dependencies';

export interface ICreateClientPurchaseOrderItemInput {
    productId?: number;
    productVariantId?: number;
    quantity: number;
    unitPrice?: number;
    price?: number;
    clientClientPurchaseUom?: string; // Optional: If empty, code will look up the product default!
}

interface CreateClientPurchaseOrderDto{
    tenantId:number;
    
    createdByUserId?:number;
    items: ICreateClientPurchaseOrderItemInput[]; 
    [key:string]:any;
}

export interface CreatedClientPurchaseOrderResponse {
    clientClientPurchaseOrder: ClientPurchaseOrder;
  
}
export class ClientPurchaseService{

 private clientClientPurchaseRepository!: Repository<ClientPurchaseOrder>;

 //============================================================================================================================================
     /**
         * Initializes the ClientPurchaseService with its TypeORM repository instances.
         * This MUST be called AFTER AppDataSource.initialize() has completed.
         * @param clientClientPurchaseRepo The TypeORM Repository instance for ClientPurchase.
         */
        async init(clientClientPurchaseRepo: Repository<ClientPurchaseOrder>
    ): Promise<void> {
            this.clientClientPurchaseRepository = clientClientPurchaseRepo;
           
                console.log("ClientPurchaseService repository initialized.");       
        }
//============================================================================================================================================




//============================================================================================================================================
        async createClientPurchaseOrder(
    createDto: CreateClientPurchaseOrderDto,
    manager?: EntityManager
): Promise<CreatedClientPurchaseOrderResponse> {
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

        const poRepo = activeManager.getRepository(ClientPurchaseOrder);
        const poiRepo = activeManager.getRepository(ClientPurchaseOrderItem);
        const productRepo = activeManager.getRepository(Product);
        const variantRepo = activeManager.getRepository(ProductVariant);

        let targetOrder: ClientPurchaseOrder;

        // Check if the clientClientPurchase order already exists under this tenant
        let existingPo = await poRepo.findOne({ 
            where: { 
                tenantId: createDto.tenantId, 
                poNumber: createDto.poNumber,
                //vendorId: createDto.vendorId
            } 
        });
        
        // --- ENRICH & VALIDATE LINE ITEMS (WITH AUTOMATED UOM FALLBACK) ---
        const enrichedItems: ClientPurchaseOrderItem[] = [];
        
        for (const itemInput of (createDto.items || [])) {
            const poi = new ClientPurchaseOrderItem();
            poi.quantity = Number(itemInput.quantity || 0);
            poi.finalPrice = Number(itemInput.unitPrice || itemInput.price || 0.00);

            let chosenUom = itemInput.clientClientPurchaseUom?.trim();

            // Pathway A: Flat Product
            if (itemInput.productId && !itemInput.productVariantId) {
                const product = await productRepo.findOne({ 
                    where: { id: itemInput.productId, tenantId: createDto.tenantId } 
                });
                if (!product) throw new Error(`Product ID ${itemInput.productId} not found.`);

                // AUTOMATION FALLBACK RULE: Fallback to master default if payload is empty
                if (!chosenUom) {
                    chosenUom = product.defaultClientPurchaseUom || product.baseUom;
                }

                poi.productId = product.id;
                poi.productVariantId = null; 
                poi.prodName = product.prodName;
                poi.sku = product.sku;
                (poi as any).clientClientPurchaseUom = chosenUom; // Attach tracking descriptor string dynamically

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
                    chosenUom = variant.productTemplate.defaultClientPurchaseUom || variant.productTemplate.baseUom;
                }

                poi.productId = null;
                poi.productVariantId = variant.id;
                
                const sizeStr = variant.size ? ` (${variant.size})` : '';
                const finishStr = variant.finish ? ` - ${variant.finish}` : '';
                poi.prodName = `${variant.productTemplate.prodName}${sizeStr}${finishStr}`;
                poi.sku = variant.sku;
                (poi as any).clientClientPurchaseUom = chosenUom;

            } else {
                throw new Error("Invalid clientClientPurchase item format. Provide exactly one: productId OR productVariantId.");
            }

            enrichedItems.push(poi);
        }

        // --- EXECUTE WRITE OPERATIONS ---
        if (existingPo) {
            console.log(`Found existing ClientPurchase Order: ${existingPo.poNumber}, performing update.`);
            
            const oldItems = await poiRepo.find({ where: { clientClientPurchaseOrderId: existingPo.id } });
            await poiRepo.delete({ clientClientPurchaseOrderId: existingPo.id });

            const { poNumber, ...updateData } = createDto;
            poRepo.merge(existingPo, updateData);  
            existingPo.items = enrichedItems;
            targetOrder = await poRepo.save(existingPo);

            // Re-runs adjustments utilizing safe calculated fallbacks
            await this.adjustClientPurchaseStockDelta(activeManager, createDto.tenantId, oldItems, enrichedItems);
            
        } else {
            console.log('Generating autonumbering...');
            const generatedPONumber = await this.generateClientPurchaseOrderNumber(activeManager, 'STANDARD');
            createDto.poNumber = generatedPONumber;

            console.log(`Creating fresh ClientPurchase Order: ${createDto.poNumber}`);
            const newPO = poRepo.create(createDto);
            newPO.items = enrichedItems;
            
            targetOrder = await poRepo.save(newPO);

            // Direct stock increment applying standard conversions
            await this.incrementProductStock(activeManager, createDto.tenantId, enrichedItems);
        }

        if (!isExternalTransaction && queryRunner) {
            await queryRunner.commitTransaction();
        }

        return { clientClientPurchaseOrder: targetOrder };

    } catch (error) {
        if (!isExternalTransaction && queryRunner) {
            await queryRunner.rollbackTransaction();
        }
        console.error('Error in createClientPurchaseOrder:', error);
        throw error;
    } finally {
        if (!isExternalTransaction && queryRunner) {
            await queryRunner.release();
        }
    }
}
//============================================================================================================================================


//============================================================================================================================================
private async adjustClientPurchaseStockDelta(
    txManager: EntityManager,
    tenantId: number,
    oldItems: ClientPurchaseOrderItem[],
    newItems: ClientPurchaseOrderItem[]
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
                console.log(`Product ID ${pid}: Increasing clientClientPurchase stock delta by +${diff} ${inventoryTrackingUom}.`);
                await productRepo.increment({ id: pid }, 'currentstock', diff);
            } else if (diff < 0) {
                console.log(`Product ID ${pid}: Decreasing clientClientPurchase stock delta by ${diff} ${inventoryTrackingUom}.`);
                await productRepo.decrement({ id: pid }, 'currentstock', Math.abs(diff));
            }
            
            oldFlatMap.delete(currentCompoundKey);

        // --- TRACK PRODUCT VARIANTS ---
        } else if (vid) {
            const oldSaleUnitsQty = oldVariantMap.get(currentCompoundKey) || 0;
            const diff = newSaleUnitsQty - oldSaleUnitsQty;

            if (diff > 0) {
                console.log(`Variant ID ${vid}: Increasing clientClientPurchase stock delta by +${diff} ${inventoryTrackingUom}.`);
                await variantRepo.increment({ id: vid }, 'currentstock', diff);
            } else if (diff < 0) {
                console.log(`Variant ID ${vid}: Decreasing clientClientPurchase stock delta by ${diff} ${inventoryTrackingUom}.`);
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
    items: ClientPurchaseOrderItem[]
): Promise<void> {
    const productRepo = txManager.getRepository(Product);
    const variantRepo = txManager.getRepository(ProductVariant);

    for (const it of items) {
        const clientClientPurchaseQty = Number(it.quantity || 0);
        if (clientClientPurchaseQty === 0) continue;

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
        const targetStockQty = clientClientPurchaseQty * factor;

        console.log(
            `Incrementing Stock [ID: ${lookupCriteria.id}]: Adding +${targetStockQty} ${inventoryTrackingUom} ` +
            `(Converted from ${clientClientPurchaseQty} "${incomingUom}" via factor ${factor})`
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
    clientClientPurchaseUom?: string
): Promise<number> {
    // If no specific unit is passed, assume a 1:1 base unit calculation fallback
    if (!clientClientPurchaseUom || clientClientPurchaseUom.trim() === '') {
        return 1.0000;
    }

    const conversionRepo = txManager.getRepository(ProductUomConversion);
    
    // Look up the conversion rule strictly isolated by tenant and product type
    const conversion = await conversionRepo.findOne({
        where: {
            tenantId: tenantId,
            productId: productId ?? undefined,          // TypeORM ignores undefined properties in where clauses
            productVariantId: productVariantId ?? undefined,
            purchaseUom: clientClientPurchaseUom.trim()
        }
    });

    if (conversion) {
        return Number(conversion.conversionFactor);
    }

    // Dynamic Log Warning: Help developers track down missing setups in the ERP backend
    console.warn(
        `[UOM Warning] No conversion rule found for Tenant: ${tenantId}, ` +
        `Product: ${productId || 'N/A'}, Variant: ${productVariantId || 'N/A'}, ` +
        `UOM: "${clientClientPurchaseUom}". Defaulting to factor 1.0000.`
    );

    return 1.0000;
}
//============================================================================================================================================




//============================================================================================================================================
      /* ---------------------------------------------------------
         GET SINLGE PO FOR TENANT – unchanged
         --------------------------------------------------------- */
      async getClientPO(
        tenantId: number,poId:number,
        manager?: EntityManager
      ): Promise<ClientPurchaseOrder[]> {
        if (!this.clientClientPurchaseRepository) {
          throw new Error(
            'ClientPurchaseService repository not initialized. Call init() first.'
          );
        }
    
        const repo = manager
          ? manager.getRepository(ClientPurchaseOrder)
          : this.clientClientPurchaseRepository;
    
        const pos = await repo.find({ where: { tenantId , id:poId } ,relations:{items:true} });
      
        return pos;
      }
      //============================================================================================================================================

       
//============================================================================================================================================
      /* ---------------------------------------------------------
         GET ALL POs FOR TENANT – unchanged
         --------------------------------------------------------- */
      async getClientPOs(
        tenantId: number,
        manager?: EntityManager
      ): Promise<ClientPurchaseOrder[]> {
        if (!this.clientClientPurchaseRepository) {
          throw new Error(
            'ClientPurchaseService repository not initialized. Call init() first.'
          );
        }
    
        const repo = manager
          ? manager.getRepository(ClientPurchaseOrder)
          : this.clientClientPurchaseRepository;
    
        const pos = await repo.find({ where: { tenantId } ,relations:{items:true} });
      
        return pos;
      }
      //============================================================================================================================================




//============================================================================================================================================
          public async generateClientPurchaseOrderNumber(
          transactionalEntityManager: EntityManager, 
          channelCode: string = "W"
      ): Promise<string> {
          console.log('--- START: generateClientPurchaseOrderNumber ---');
          
          try {
              const now = new Date();
              const yearMonth = `${now.getFullYear().toString().slice(-2)}${(now.getMonth() + 1).toString().padStart(2, '0')}`;
              const docType = "ClientPurchase_ORDER";
              
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
              console.error('--- ERROR in generateClientClientPurchaseOrderNumber ---');
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
const uniqueClientPurchaseUnits = structuredUnits.filter((unit, index, self) =>
  index === self.findIndex((u) => u.value.toLowerCase() === unit.value.toLowerCase())
);

const hasBaseUnit = uniqueClientPurchaseUnits.some(u => u.value.toLowerCase() === activeBaseUom.toLowerCase());

if (!hasBaseUnit) {
  uniqueClientPurchaseUnits.unshift({
    label: `${activeBaseUom} (Baseline)`,
    value: activeBaseUom,
    factor: 1.0000,
    targetSaleUom: activeBaseUom
  });
}

return {
  baseInventoryUom: activeBaseUom,
  availableClientPurchaseUnits: uniqueClientPurchaseUnits // Returns a distinct, clean array
};

}

 //end for dealing with units------------------------
//===========================================================================================


    }

export default ClientPurchaseService