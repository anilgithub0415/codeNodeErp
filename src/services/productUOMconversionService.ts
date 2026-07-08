
import { EntityManager, Not, Repository } from 'typeorm';
import { ProductUomConversion } from '../entity/ProductUomConversion';



import { AppDataSource } from '../../data-source'; 

interface CreateProductUomConversionDto{
    tenantId:number;
   
    createdByUserId?:number;
    [key:string]:any;
}

export interface CreatedProductUomConversionResponse {
    ProductUomConversion: ProductUomConversion;
  
}

export class ProductUomConversionService{
 private ProductUomConversionRepository!: Repository<ProductUomConversion>;
     /**
         * Initializes the ProductUomConversionService with its TypeORM repository instances.
         * This MUST be called AFTER AppDataSource.initialize() has completed.
         * @param ProductUomConversionRepo The TypeORM Repository instance for ProductUomConversion.
         * @param tenantRepo The TypeORM Repository instance for Tenant (if ProductUomConversionService needs it).
         */
        async init(ProductUomConversionRepo: Repository<ProductUomConversion>): Promise<void> {
            this.ProductUomConversionRepository = ProductUomConversionRepo;
                console.log("ProductUomConversionService repository initialized.");       
        }


        async getProductUomConversion(
            ptenantId:number,  pProductId:number|null,    pProductVariantId:number|null,
            manager?: EntityManager
        ): Promise<ProductUomConversion[]> {
console.log('hitting url ProductUomConversions');
             if (!this.ProductUomConversionRepository) {
                        throw new Error("ProductUomConversionService repository not initialized. Call init() first.");
                    }
console.log('this is being called with pid:',pProductVariantId);

                   
                    
                    const ProductUomConversionRepository = manager ? manager.getRepository(ProductUomConversion) : this.ProductUomConversionRepository;
                    var  ps; 
                    if(pProductId !== null){ //flat Product
                    ps= await ProductUomConversionRepository.find({where:{tenantId:ptenantId , productId:pProductId}}); 
                    }else if(pProductVariantId!==null) //Variant

                        {
                        ps= await ProductUomConversionRepository.find({where:{tenantId:ptenantId , productVariantId:pProductVariantId}}); 
                    }
                    
                    return ps!; 
                }


        async getProductUomConversions(
            ptenantId:number,   pProductId:number,    pProductVariantId:number,    
            manager?: EntityManager
        ): Promise<ProductUomConversion[]> {
console.log('hitting url ProductUomConversions');
             if (!this.ProductUomConversionRepository) {
                        throw new Error("ProductUomConversionService repository not initialized. Call init() first.");
                    }

                    console.log('productid:',pProductId);
                    console.log('pProductVariantId:',pProductVariantId);
                    
                    
                    const ProductUomConversionRepository = manager ? manager.getRepository(ProductUomConversion) : this.ProductUomConversionRepository;
                    var ps; 
                   if(pProductId){
                     ps= await ProductUomConversionRepository.find({where:{tenantId:ptenantId, productId:pProductId} }); // Use find() to get all 
                   }else{
                     ps= await ProductUomConversionRepository.find({where:{tenantId:ptenantId, productVariantId:pProductVariantId} }); // Use find() to get all 
                   }
                    console.log('ProductUomConversions :',ps);
                    
                    return ps;
                }


    /**
     * Creates a new global ProductUomConversion, links them to a Person, and establishes their initial context
     * within a specified tenant and role.
     * This method now also atomically creates a role-specific profile (e.g., FacultyProfile).
     *
     * @param createDto Data for creating the ProductUomConversion and their initial context.
     * @param manager Optional EntityManager for transactional operations.
     * @returns The created ProductUomConversion entity along with its initial context.
     */
    async createProductUomConversion(
        createDto: CreateProductUomConversionDto,
        manager?: EntityManager
    ): Promise<CreatedProductUomConversionResponse> {
        const queryRunner = manager ? manager.queryRunner : AppDataSource.createQueryRunner();
        let shouldReleaseQueryRunner = false;

        try {
            if (!manager) {
                await queryRunner!.connect();
                await queryRunner!.startTransaction();
                shouldReleaseQueryRunner = true;
            }

          
            const ProductUomConversionRepo = queryRunner!.manager.getRepository(ProductUomConversion);
                    

            

            // 3. Create or Find ProductUomConversion (existing logic)
            let newORexistingProductUomConversion: ProductUomConversion;
            //by productId
            let aProductUomConversion = await ProductUomConversionRepo.findOne({ where: {tenantId:createDto.tenantId, productId: createDto.productId,purchaseUom:createDto.purchaseUom } });
           
            if (aProductUomConversion) {
                console.log(`found ProductUomConversion with productId: ${createDto.productId}`);
              
                
                 Object.assign(aProductUomConversion, createDto);  newORexistingProductUomConversion =aProductUomConversion;
                console.log('updating:',aProductUomConversion);

                await ProductUomConversionRepo.save(aProductUomConversion); 
            } else {
               
               console.log('new conversion creation................',createDto);
               
                let newProductUomConversion = ProductUomConversionRepo.create(
                    createDto                   
                );
           
                newORexistingProductUomConversion = newProductUomConversion;
                   await ProductUomConversionRepo.save(newProductUomConversion);  
            }



           

            if (shouldReleaseQueryRunner) {
                await queryRunner!.commitTransaction();
            }

          return { ProductUomConversion: newORexistingProductUomConversion };
       
            

        } catch (error) {
            if (shouldReleaseQueryRunner) {
                await queryRunner!.rollbackTransaction();
            }
            console.error('Error in createProductUomConversionAndContext:', error);
            throw error;
        } finally {
            if (shouldReleaseQueryRunner) {
                await queryRunner!.release();
            }
        }
    }
    }
           
export default ProductUomConversionService