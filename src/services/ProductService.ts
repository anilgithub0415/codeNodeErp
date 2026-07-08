
import { EntityManager, Not, Repository } from 'typeorm';
import { Product } from '../entity/Product';



import { AppDataSource } from '../../data-source'; 

interface CreateProductDto{
    id?:number;
    tenantId:number;
    prodName:string;
    description:string;
    sku:string;
    basePrice:number;
    createdByUserId?:number;
    [key:string]:any;
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


        async getProduct(
            ptenantId:number,   pProdId:number,        
            manager?: EntityManager
        ): Promise<Product> {
console.log('hitting url products');
             if (!this.productRepository) {
                        throw new Error("ProductService repository not initialized. Call init() first.");
                    }

                   
                    
                    const productRepository = manager ? manager.getRepository(Product) : this.productRepository;
                    const ps= await productRepository.findOne({where:{tenantId:ptenantId , id:pProdId}}); // Use find() to get all 
                 
                    
                    return ps!; 
                }


        async getProducts(
            ptenantId:number,           
            manager?: EntityManager
        ): Promise<Product[]> {
console.log('hitting url products');
             if (!this.productRepository) {
                        throw new Error("ProductService repository not initialized. Call init() first.");
                    }

                    console.log('ptenantId:',ptenantId);
                    
                    const productRepository = manager ? manager.getRepository(Product) : this.productRepository;
                    const ps= await productRepository.find({where:{tenantId:ptenantId}, relations: ['hsnTaxRule'] }); // Use find() to get all 
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
                    

            console.log('finding createDto.id:',createDto.id);
            

            // 3. Create or Find Product (existing logic)
            let newORexistingproduct: Product;
            // 1. Look up by a unique, unchanging identifier
            // 1. Guard against undefined ID to force a new product creation
let aProduct = null;
if (createDto.id) {
    aProduct = await productRepo.findOne({ 
        where: { id: createDto.id, tenantId: createDto.tenantId } 
    });
}

if (aProduct) {
    console.log('editing existing prod..................');
    Object.assign(aProduct, createDto);  
    newORexistingproduct = await productRepo.save(aProduct); // Assign to tracking variable
} else {
    console.log('creating new prod......................');
    let newProduct = productRepo.create(createDto);
    newORexistingproduct = await productRepo.save(newProduct); // Assign to tracking variable
}

if (shouldReleaseQueryRunner) {
    await queryRunner!.commitTransaction();
}

// 2. Fix the return variable (was aProduct, should be newORexistingproduct)
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