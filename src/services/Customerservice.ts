
import { Repository,EntityManager } from 'typeorm'; 
import { Customer } from "../entity/Customer";
import { getCustomerServiceRepository } from '../dependencies';



import { AppDataSource } from '../../data-source'; 

interface CreateCustomerDto{
   tenantId:number;
    customerName:string;
    customerCategory:string;
    //createdByUserId?:string;
    [key:string]:any;
}
export interface CreatedCustomerResponse {
    customer: Customer;
  
}

class CustomerService{
  private customerRepository!: Repository<Customer>;

        constructor() {
            // Constructor is lean, repository will be injected or set via init
        }
    
        /**
         * Initializes the TenantService with its TypeORM repository.
         * This MUST be called AFTER AppDataSource.initialize() has completed.
         * @param repo The TypeORM Repository instance for Tenant.
         */
        async init(customerRepo: Repository<Customer>): Promise<void> {
            this.customerRepository = customerRepo;
            
            console.log("CustomerService repositories initialized.");
        }


        

            /**
             * Retrieves a single Customer by their global ID.
             * @param customerId The global ID of the Customer.
             * @param manager Optional EntityManager.
             * @returns A promise that resolves to the Customer entity or null if not found.
             */
            async getCustomerById(tenantdId:number,customerId: number, manager?: EntityManager): Promise<Customer | null> {
                const customerRepo = manager ? manager.getRepository(Customer) : this.customerRepository;
             
                
                
                return await customerRepo.findOne({
                    where: { id: customerId },
               
                });
            }


        async getCustomers(
            ptenantId:number,           
            manager?: EntityManager
        ): Promise<Customer[]> {

             if (!this.customerRepository) {
                        throw new Error("CustomerService repository not initialized. Call init() first.");
                    }

                    console.log('ptenantId:',ptenantId);
                    
                    const customerRepository = manager ? manager.getRepository(Customer) : this.customerRepository;
                    const ps= await customerRepository.find({where:{tenantId:ptenantId}}); // Use find() to get all 
                    console.log('customers count:',ps.length);
                    
                    return ps;
                }

    /**
     * Creates a new global Customer, links them to a Person, and establishes their initial context
     * within a specified tenant and role.
     * This method now also atomically creates a role-specific profile (e.g., FacultyProfile).
     *
     * @param createDto Data for creating the customer and their initial context.
     * @param manager Optional EntityManager for transactional operations.
     * @returns The created Customer entity along with its initial context.
     */
    async createCustomer(
        createDto: CreateCustomerDto,
        manager?: EntityManager
    ): Promise<CreatedCustomerResponse> {
        const queryRunner = manager ? manager.queryRunner : AppDataSource.createQueryRunner();
        let shouldReleaseQueryRunner = false;

        try {
            if (!manager) {
                await queryRunner!.connect();
                await queryRunner!.startTransaction();
                shouldReleaseQueryRunner = true;
            }

          
            const customerRepo = queryRunner!.manager.getRepository(Customer);
                    

            

            // 3. Create or Find Customer (existing logic)
            let newORexistingcustomer: Customer;
            let aCustomer = await customerRepo.findOne({ where: {tenantId:createDto.tenantId, customerName: createDto.customerName } });
           
            if (aCustomer) {
                console.log(`found customer with name: ${createDto.customerName}`);
              
                
                 Object.assign(aCustomer, createDto);  newORexistingcustomer =aCustomer;
                console.log('updating:',aCustomer);

                await customerRepo.save(aCustomer); 
            } else {
                
                let newCustomer = customerRepo.create(
                    createDto                   
                );
           
                newORexistingcustomer = newCustomer;
                   await customerRepo.save(newCustomer);  
            }



           

            if (shouldReleaseQueryRunner) {
                await queryRunner!.commitTransaction();
            }

          return { customer: newORexistingcustomer };
       
            

        } catch (error) {
            if (shouldReleaseQueryRunner) {
                await queryRunner!.rollbackTransaction();
            }
            console.error('Error in createCustomer:', error);
            throw error;
        } finally {
            if (shouldReleaseQueryRunner) {
                await queryRunner!.release();
            }
        }
    }


}

export default CustomerService