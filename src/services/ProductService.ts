
import { EntityManager, Not, Repository } from 'typeorm';
import { Product } from '../entity/Product';



import { AppDataSource } from '../../data-source'; 

interface CreateProductDto{
    tenantId:string;
    prodName:string;
    description:string;
    sku:string;
    basePrice:number;
    createdByUserId?:number;
}

export interface CreatedProductResponse {
    product: Product;
  
}

export class ProductService{
 private productRepository!: Repository<Product>;
     /**
         * Initializes the ProductService with its TypeORM repository instances.
         * This MUST be called AFTER AppDataSource.initialize() has completed.
         * @param productRepo The TypeORM Repository instance for Product.
         * @param tenantRepo The TypeORM Repository instance for Tenant (if ProductService needs it).
         */
        async init(productRepo: Repository<Product>): Promise<void> {
            this.productRepository = productRepo;
                console.log("ProductService repository initialized.");       
        }



        async getProducts(
            ptenantId:string,           
            manager?: EntityManager
        ): Promise<Product[]> {
console.log('hitting url products');
             if (!this.productRepository) {
                        throw new Error("ProductService repository not initialized. Call init() first.");
                    }
                    const productRepository = manager ? manager.getRepository(Product) : this.productRepository;
                    const ps= await productRepository.find({where:{}, withDeleted:true}); // Use find() to get all //where:{tenantId:ptenantId}
                    console.log('products count:',ps.length);
                    
                    return ps;
                }


    /**
     * Creates a new global Product, links them to a Person, and establishes their initial context
     * within a specified tenant and role.
     * This method now also atomically creates a role-specific profile (e.g., FacultyProfile).
     *
     * @param createDto Data for creating the product and their initial context.
     * @param manager Optional EntityManager for transactional operations.
     * @returns The created Product entity along with its initial context.
     */
    async createProduct(
        createDto: CreateProductDto,
        manager?: EntityManager
    ): Promise<CreatedProductResponse> {
        const queryRunner = manager ? manager.queryRunner : AppDataSource.createQueryRunner();
        let shouldReleaseQueryRunner = false;

        try {
            if (!manager) {
                await queryRunner!.connect();
                await queryRunner!.startTransaction();
                shouldReleaseQueryRunner = true;
            }

          
            const productRepo = queryRunner!.manager.getRepository(Product);
                    

            

            // 3. Create or Find Product (existing logic)
            let newORexistingproduct: Product;
            let aProduct = await productRepo.findOne({ where: {tenantId:createDto.tenantId, prodName: createDto.prodName } });
           
            if (aProduct) {
                console.log(`found product with name: ${createDto.prodName}`);
              
                
                 Object.assign(aProduct, createDto);  newORexistingproduct =aProduct;
                console.log('updating:',aProduct);

                await productRepo.save(aProduct); 
            } else {
                console.log(`creating product with data productname: ${createDto}`);
               
                let newProduct = productRepo.create(
                    createDto                   
                );
           
                newORexistingproduct = newProduct;
                   await productRepo.save(newProduct);  
            }



           

            if (shouldReleaseQueryRunner) {
                await queryRunner!.commitTransaction();
            }

          return { product: newORexistingproduct };
       
            

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
           
export default ProductService