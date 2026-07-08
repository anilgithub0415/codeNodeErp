
import { EntityManager, FindOptionsWhere, Not, Repository } from 'typeorm';
import { Vendor } from '../entity/Vendor';



import { AppDataSource } from '../../data-source'; 

interface CreateVendorDto{
    id?:number;
    tenantId:number;
    vendorName:string;
    description: string;
    [key:string]:any;
}

export interface CreatedVendorResponse {
    vendor: Vendor;
  
}

export class VendorService{
 private vendorRepository!: Repository<Vendor>;
     /**
         * Initializes the VendorService with its TypeORM repository instances.
         * This MUST be called AFTER AppDataSource.initialize() has completed.
         * @param vendorRepo The TypeORM Repository instance for Vendor.
         * @param tenantRepo The TypeORM Repository instance for Tenant (if VendorService needs it).
         */
        async init(vendorRepo: Repository<Vendor>): Promise<void> {
            this.vendorRepository = vendorRepo;
                console.log("VendorService repository initialized.");       
        }


        async getVendor(
            ptenantId:number,   pProdId:number,        
            manager?: EntityManager
        ): Promise<Vendor> {
console.log('hitting url vendors');
             if (!this.vendorRepository) {
                        throw new Error("VendorService repository not initialized. Call init() first.");
                    }

                   
                    
                    const vendorRepository = manager ? manager.getRepository(Vendor) : this.vendorRepository;
                    const ps= await vendorRepository.findOne({where:{tenantId:ptenantId , id:pProdId}}); // Use find() to get all 
                 
                    
                    return ps!; 
                }


        async getVendors(
            ptenantId:number,           
            manager?: EntityManager
        ): Promise<Vendor[]> {
console.log('hitting url vendors');
             if (!this.vendorRepository) {
                        throw new Error("VendorService repository not initialized. Call init() first.");
                    }

                    console.log('ptenantId:',ptenantId);
                    
                    const vendorRepository = manager ? manager.getRepository(Vendor) : this.vendorRepository;
                    const ps= await vendorRepository.find({where:{tenantId:ptenantId}}); // Use find() to get all 
                    console.log('vendors count:',ps.length);
                    
                    return ps;
                }


    /**
     * Creates a new global Vendor, links them to a Person, and establishes their initial context
     * within a specified tenant and role.
     * This method now also atomically creates a role-specific profile (e.g., FacultyProfile).
     *
     * @param createDto Data for creating the vendor and their initial context.
     * @param manager Optional EntityManager for transactional operations.
     * @returns The created Vendor entity along with its initial context.
     */
    async createVendor(
        createDto: CreateVendorDto,
        manager?: EntityManager
    ): Promise<CreatedVendorResponse> {
        const queryRunner = manager ? manager.queryRunner : AppDataSource.createQueryRunner();
        let shouldReleaseQueryRunner = false;

        try {
            if (!manager) {
                await queryRunner!.connect();
                await queryRunner!.startTransaction();
                shouldReleaseQueryRunner = true;
            }

          
            const vendorRepo = queryRunner!.manager.getRepository(Vendor);
                    

            

            // 3. Create or Find Vendor (existing logic)
            let newORexistingvendor: Vendor;
          
                          const { id, tenantId, ...uniqueIdentifiers } = createDto;
                          let queryCondition: FindOptionsWhere<Vendor> = { tenantId };
                          if (createDto.id) {
                              queryCondition.id = createDto.id;
                          } else {
                               Object.assign(queryCondition, uniqueIdentifiers);
                          }
                          // FIX: Find by ID so you can safely update the districtName property
                          let aVendor = await vendorRepo.findOne({ 
                              where: queryCondition
                          });
                  
          
            if (aVendor) {
                console.log(`found vendor with name: ${createDto.prodName}`);
              
                
                 Object.assign(aVendor, createDto);  newORexistingvendor =aVendor;
                console.log('updating:',aVendor);

                await vendorRepo.save(aVendor); 
            } else {
             
               
                let newVendor = vendorRepo.create(
                    createDto                   
                );
           
                newORexistingvendor = newVendor;
                   await vendorRepo.save(newVendor);  
            }



           

            if (shouldReleaseQueryRunner) {
                await queryRunner!.commitTransaction();
            }

          return { vendor: newORexistingvendor };
       
            

        } catch (error) {
            if (shouldReleaseQueryRunner) {
                await queryRunner!.rollbackTransaction();
            }
            console.error('Error in createVendorAndContext:', error);
            throw error;
        } finally {
            if (shouldReleaseQueryRunner) {
                await queryRunner!.release();
            }
        }
    }
    }
           
export default VendorService