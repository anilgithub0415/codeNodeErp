
import { EntityManager, Not, Repository } from 'typeorm';

import { AppDataSource } from '../../data-source'; 
import { PurchaseOrder } from '../entity/PurchaseOrder';
import {PurchaseOrderItem} from '../entity/PurchaseOrderItem'
import { Product } from '../entity/Product';


interface CreatePurchaseOrderDto{
    tenantId:number;
    
    createdByUserId?:number;
    [key:string]:any;
}

export interface CreatedPurchaseOrderResponse {
    purchaseOrder: PurchaseOrder;
  
}
export class PurchaseService{

 private purchaseRepository!: Repository<PurchaseOrder>;
     /**
         * Initializes the PurchaseService with its TypeORM repository instances.
         * This MUST be called AFTER AppDataSource.initialize() has completed.
         * @param purchaseRepo The TypeORM Repository instance for Purchase.
         */
        async init(purchaseRepo: Repository<PurchaseOrder>): Promise<void> {
            this.purchaseRepository = purchaseRepo;
                console.log("PurchaseService repository initialized.");       
        }



            async createPurchaseOrder(
                createDto: CreatePurchaseOrderDto,
                manager?: EntityManager
            ): Promise<CreatedPurchaseOrderResponse> {
                const queryRunner = manager ? manager.queryRunner : AppDataSource.createQueryRunner();
                let shouldReleaseQueryRunner = false;
        
                try {
                    if (!manager) {
                        await queryRunner!.connect();
                        await queryRunner!.startTransaction();
                        shouldReleaseQueryRunner = true;
                    }
        
                  
                    const purchaseRepo = queryRunner!.manager.getRepository(PurchaseOrder);
                                             
        
                    
        
                    // 3. Create or Find PurchaseOrder (existing logic)
                    let newORexistingpurchaseOrder: PurchaseOrder;
                    let aPurchase = await purchaseRepo.findOne({ where: {tenantId:createDto.tenantId, poNumber: createDto.poNumber } });
                     if (aPurchase) {
                            console.log(`found purchase with name: ${createDto.prodName}`);
                        
                            
                            Object.assign(aPurchase, createDto);  newORexistingpurchaseOrder =aPurchase;
                            console.log('updating:',aPurchase);

                         await purchaseRepo.save(aPurchase); 
                         //--consider delta while update for currentstock
                         // for updates: compute diff and apply only the delta
                              const productRepo = queryRunner!.manager.getRepository(Product);
                                        const items = (newORexistingpurchaseOrder.items || createDto.items) || [];

                             const poiRepo = queryRunner!.manager.getRepository(PurchaseOrderItem);
                            const oldItems = await poiRepo.find({ where: { purchaseOrderId: aPurchase.id } });
                            const oldMap = new Map(oldItems.map(i => [i.productId, Number(i.quantity)]));
                            const newItems = createDto.items || aPurchase.items || [];

                            for (const it of newItems) {
                            const pid = it.productId;
                            const delta = Number(it.quantity || 0) - (oldMap.get(pid) || 0);
                            if (delta === 0) continue; console.log('delta:',delta,' for pid:',pid);
                            
                            await productRepo.increment({ id: pid }, 'currentstock', delta);
                            }
                         //--end currentstock delta consideration
                    } else {
                        console.log(`creating purchase with data : ${createDto}`);
                    
                        let newPurchase = purchaseRepo.create(
                            createDto                   
                        );
                
                        newORexistingpurchaseOrder = newPurchase;
                        //i think here we need to increment stock
                        await purchaseRepo.save(newPurchase);  
                                    //--increment stock
                                    // after `await purchaseRepo.save(newPurchase);` (still inside same transaction)
                                        const productRepo = queryRunner!.manager.getRepository(Product);
                                        const items = (newORexistingpurchaseOrder.items || createDto.items) || [];

                                        for (const it of items) {
                                        const pid = it.productId;
                                        const qty = Number(it.quantity || 0);
                                        if (!pid || qty === 0) continue;
                                        console.log(pid,' is incrementing stock by ',qty);
                                        
                                        await productRepo.increment({ id: pid }, 'currentstock', qty);
                                        }
                                    //end increment stock    
                    }
                    
                    if (shouldReleaseQueryRunner) {
                    await queryRunner!.commitTransaction();
                }

            return { purchaseOrder: newORexistingpurchaseOrder };
        
                

            } catch (error) {
                if (shouldReleaseQueryRunner) {
                    await queryRunner!.rollbackTransaction();
                }
                console.error('Error in createProductAndContext:', error);
                throw error;
            } finally {
                if (shouldReleaseQueryRunner) {
                    await queryRunner!.release();
                }
            }
    }

}
export default PurchaseService