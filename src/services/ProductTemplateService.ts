
import { EntityManager, Not, Repository } from 'typeorm';
import { ProductTemplate } from '../entity/product_template';



import { AppDataSource } from '../../data-source'; 
import { ProductVariant } from '../entity/productVariant';

interface CreateProductTemplateDto{
    tenantId:number;
    prodName:string;
    description:string;
    sku:string;
    basePrice:number;
    createdByUserId?:number;
    [key:string]:any;
}

export interface CreatedProductTemplateResponse {
    product: ProductTemplate;
  
}

export class ProductTemplateService{
 private productTemplateRepository!: Repository<ProductTemplate>;
     /**
         * Initializes the ProductTemplateService with its TypeORM repository instances.
         * This MUST be called AFTER AppDataSource.initialize() has completed.
         * @param productTemplateRepo The TypeORM Repository instance for ProductTemplate.
        
         */
        async init(productTempRepo: Repository<ProductTemplate>): Promise<void> {
            this.productTemplateRepository = productTempRepo;
                console.log("ProductTemplateService repository initialized.");       
        }


        async getProductTemplate(
            ptenantId:number,   pProdId:number,        
            manager?: EntityManager
        ): Promise<ProductTemplate> {
console.log('hitting url products');
             if (!this.productTemplateRepository) {
                        throw new Error("ProductTemplateService repository not initialized. Call init() first.");
                    }

                   
                    
                    const productRepository = manager ? manager.getRepository(ProductTemplate) : this.productTemplateRepository;
                    const ps= await productRepository.findOne({where:{tenantId:ptenantId , id:pProdId}}); // Use find() to get all 
                 
                    
                    return ps!; 
                }


        async getProductTemplates(
            ptenantId:number,           
            manager?: EntityManager
        ): Promise<ProductTemplate[]> {
console.log('hitting url products');
             if (!this.productTemplateRepository) {
                        throw new Error("ProductTemplateService repository not initialized. Call init() first.");
                    }

                    console.log('ptenantId:',ptenantId);
                    
                    const productRepository = manager ? manager.getRepository(ProductTemplate) : this.productTemplateRepository;
                    const ps= await productRepository.find({where:{tenantId:ptenantId},relations:['variants']}); // Use find() to get all 
                    console.log('products count:',ps.length);
                    
                    return ps;
                }


    /**
     * Creates a new global ProductTemplate, links them to a Person, and establishes their initial context
     * within a specified tenant and role.
     * This method now also atomically creates a role-specific profile (e.g., FacultyProfile).
     *
     * @param createDto Data for creating the product and their initial context.
     * @param manager Optional EntityManager for transactional operations.
     * @returns The created ProductTemplate entity along with its initial context.
     */
    async createProductTemplate(
        createDto: CreateProductTemplateDto,
        manager?: EntityManager
    ): Promise<CreatedProductTemplateResponse> {
        const queryRunner = manager ? manager.queryRunner : AppDataSource.createQueryRunner();
        let shouldReleaseQueryRunner = false;

        try {
            if (!manager) {
                await queryRunner!.connect();
                await queryRunner!.startTransaction();
                shouldReleaseQueryRunner = true;
            }

          
            const productTemplateRepo = queryRunner!.manager.getRepository(ProductTemplate);
                    

            

            // 3. Create or Find ProductTemplate (existing logic)
            let newORexistingproduct: ProductTemplate;
            let aProductTemplate = await productTemplateRepo.findOne({ where: {tenantId:createDto.tenantId, prodName: createDto.prodName } });
           
            if (aProductTemplate) {
                console.log(`found product with name: ${createDto.prodName}`);
              
                
                 Object.assign(aProductTemplate, createDto);  newORexistingproduct =aProductTemplate;
                console.log('updating:',aProductTemplate);

                await productTemplateRepo.save(aProductTemplate); 
            } else {
                //console.log(`creating producttemplate with data customattributes: ${createDto.customAttributes.tier_prices.B2C_price}`);
               
                let newProductTemplate = productTemplateRepo.create(
                    createDto                   
                );
           
                newORexistingproduct = newProductTemplate;
                   await productTemplateRepo.save(newProductTemplate);  
            }



           

            if (shouldReleaseQueryRunner) {
                await queryRunner!.commitTransaction();
            }

          return { product: newORexistingproduct };
       
            

        } catch (error) {
            if (shouldReleaseQueryRunner) {
                await queryRunner!.rollbackTransaction();
            }
            console.error('Error in createProductTemplateAndContext:', error);
            throw error;
        } finally {
            if (shouldReleaseQueryRunner) {
                await queryRunner!.release();
            }
        }
    }
    }
           
export default ProductTemplateService