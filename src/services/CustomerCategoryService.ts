import { Repository,EntityManager } from 'typeorm'; 
import { CustomerCategory } from "../entity/CustomerCategory";


export class CustomerCategoryService{

  private customerCategoryRepository!: Repository<CustomerCategory>;

     /**
           * Initializes the TenantService with its TypeORM repository.
           * This MUST be called AFTER AppDataSource.initialize() has completed.
           * @param repo The TypeORM Repository instance for Tenant.
           */
          async init(customerCategoryRepo: Repository<CustomerCategory>): Promise<void> {
              this.customerCategoryRepository = customerCategoryRepo;
              
              console.log("CustomerCatgeoryService repositories initialized.");
          }
  

    //for CustomerCategory lookup

        async getCustomerCategories(
            ptenantId:number,           
            manager?: EntityManager
        ): Promise<CustomerCategory[]> {

             if (!this.customerCategoryRepository) {
                        throw new Error("CustomerService repository not initialized. Call init() first.");
                    }
                   
                    
                    const customerCategoryRepository = manager ? manager.getRepository(CustomerCategory) : this.customerCategoryRepository;
                    const custCats= await customerCategoryRepository.find({where:{tenantId:ptenantId}}); // Use find() to get all 
                    
                    
                    return custCats;
                }




}

export default CustomerCategoryService;