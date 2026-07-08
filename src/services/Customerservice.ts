
import { Repository,EntityManager , QueryRunner} from 'typeorm'; 
import { Customer } from "../entity/Customer";
import { getCustomerServiceRepository } from '../dependencies';



import { AppDataSource } from '../../data-source'; 
import { CustomerCategory } from '../entity/CustomerCategory';
import { Site } from '../entity/Site';
import { SiteDto } from '../dto/Customer.dto';
import CustomerCategoryService from './CustomerCategoryService';

interface CreateCustomerDto{
    id:number;
   tenantId:number;
    customerName:string; customer_autocode:string;
    
    clientStatus:string;
    leadSource:string;
    //createdByUserId?:string;
    [key:string]:any;
}
export interface CreatedCustomerResponse {
    customer: Customer;
  
}

class CustomerService{
  private customerRepository!: Repository<Customer>;
  private orgRepository!: Repository<Site>;

        constructor() {
            // Constructor is lean, repository will be injected or set via init
        }
    
        /**
         * Initializes the TenantService with its TypeORM repository.
         * This MUST be called AFTER AppDataSource.initialize() has completed.
         * @param repo The TypeORM Repository instance for Tenant.
         */
        async init(customerRepo: Repository<Customer>,orgRepo: Repository<Site>): Promise<void> {
            this.customerRepository = customerRepo;
            this.orgRepository=orgRepo;

            console.log("CustomerService repositories initialized.");
        }

        //we are not allowing duplicate(repeat) customername in tenant
        private async ensureNoDuplicate(
        tenantId: number,
        customerName: string,
        custRepo: Repository<Customer>
        ): Promise<void> {
        const dup = await custRepo.findOne({
            where: { tenantId, customerName },
        });
        if (dup) {
            throw new Error(
            `A customer with name "${customerName}" already exists for tenant ${tenantId}.`
            );
        }
        }
  /**
 * Synchronises the child collection of sites for a given customer.
 *
 *  • New DTOs (no `id`) → create new Site rows.
 *  • Existing DTOs (have `id`) → update the matching rows.
 *  • Any Site that exists in the DB but is **not** present in the DTO
 *    array will be removed (cascade delete works if `onDelete: 'CASCADE'` is set).
 *
 * @param customer   The parent Customer entity (already persisted, has an id).
 * @param orgDtos    Array of DTOs received from the client.
 * @param orgRepo    Repository for the Site entity.
 * @param manager    EntityManager that belongs to the current transaction.
 *
 * @returns The list of Site entities that are now attached to the customer.
 */
private async syncSites(
  customer: Customer,
  orgDtos: SiteDto[],
  orgRepo: Repository<Site>,
  manager: EntityManager
): Promise<Site[]> {
  // -------------------------------------------------
  // 1️⃣ Load the sites that already belong to this customer
  // -------------------------------------------------
  const existingOrgs = await orgRepo.find({
    where: { customer: { id: customer.id } },
  });

  // -------------------------------------------------
  // 2️⃣ Build a map (id → Site) for quick lookup
  // -------------------------------------------------
  const existingMap = new Map<number, Site>();
  existingOrgs.forEach(site => existingMap.set(site.id, site));

  const result: Site[] = [];

  console.log('syncing orgs',orgDtos);
  

  // -------------------------------------------------
  // 3️⃣ Iterate over the incoming DTOs
  // -------------------------------------------------
  for (const dto of orgDtos) {
                  //find category -----------------------------------
                  // const category = await manager
                  //   .getRepository(CustomerCategory)
                  //   .findOne({ where: { customerCategory: dto.customerCategoryId } });

                  // if (!category) {
                  //   throw new Error(
                  //     `CustomerCategory  ${dto.customerCategoryId} not found`
                  //   );
                  // } 
                  //end find category------------------------------------------------

    // ----- UPDATE path (dto has an id that matches an existing row) -----
    if (dto.id && existingMap.has(dto.id)) {
      const site = existingMap.get(dto.id)!; // guaranteed to exist
      // Copy only the fields that belong to the Site entity.
      // (If you have extra fields in the DTO, filter them out here.)
        // Update organisation fields, including the correct foreign‑key property for CustomerCategory
        Object.assign(site, {
          siteName: dto.siteName,
          contactPersonName: dto.contactPersonName,
        
        });
/*  mobileNumber: dto.mobileNumber,
          EmailId: dto.EmailId,
          city: dto.city,
          Remarks: dto.Remarks,
          // Use the proper property name matching the entity definition
          customerCategoryId: category, */
      // If the category changed we need to fetch the new CustomerCategory entity.


      // if (dto.customerCategoryId) {
      //   const category = await manager
      //     .getRepository(CustomerCategory)
      //     .findOne({ where: { customerCategory: dto.customerCategoryId } });

      //   if (!category) {
      //     throw new Error(
      //       `CustomerCategory  ${dto.customerCategoryId} not found`
      //     );
      //   } 
      //   (site as any).customerCategory = category; // assign relation
      // }

      await manager.save(site); // persists updates
      result.push(site);
      existingMap.delete(dto.id); // mark as processed → will not be deleted
    } else {
      // ----- CREATE path (new organisation) -----
      // Resolve the CustomerCategory relation (required for the FK)
      // const category = await manager
      //   .getRepository(CustomerCategory)
      //   .findOne({ where: { customerCategory: dto.customerCategoryId } });

      // if (!category) {
      //   throw new Error(
      //     `CustomerCategory id ${dto.customerCategoryId} not found`
      //   );
      // }
/*mobileNumber: dto.mobileNumber,
        EmailId: dto.EmailId,
        city: dto.city,
        Remarks: dto.Remarks,
        customer,               // set the back‑reference (FK to Customer)
        customerCategory: category // category // set the relation to CustomerCategory
   */
      const newOrg = orgRepo.create({
        siteName: dto.siteName,
        
        contactPersonName: dto.contactPersonName,
            });

      await manager.save(newOrg);
      result.push(newOrg);
    }
  }

  // -------------------------------------------------
  // 4️⃣ DELETE sites that were removed on the client side
  // -------------------------------------------------
  const toDelete = Array.from(existingMap.values());
  if (toDelete.length) {
    await manager.remove(toDelete);
  }

  // -------------------------------------------------
  // 5️⃣ Return the final collection (now in sync with the DTO)
  // -------------------------------------------------
  return result;
}


  /* -----------------------------------------------------------------
     Helper – get a QueryRunner that either comes from the supplied
     manager (if it already has one) or a brand‑new one that we will
     control ourselves.
     ----------------------------------------------------------------- */
  private getQueryRunner(manager?: EntityManager): {
    runner: QueryRunner;
    ownsRunner: boolean;   // true → we created it and must manage its lifecycle
  } {
    if (manager && (manager as any).queryRunner) {
      // The caller gave us a manager that already belongs to a transaction.
      // We just reuse its queryRunner; we must NOT start/commit/rollback.
      return { runner: (manager as any).queryRunner, ownsRunner: false };
    }

    // No manager or manager without a queryRunner → we create our own.
    const runner = AppDataSource.createQueryRunner();
    return { runner, ownsRunner: true };
  }
          async createCustomer(
  dto: CreateCustomerDto,
  manager?: EntityManager
): Promise<Customer> {
  const { runner: queryRunner, ownsRunner } = this.getQueryRunner(manager);

  if (ownsRunner) {
    await queryRunner.connect();
    await queryRunner.startTransaction();
  }

  try {
    const custRepo = queryRunner.manager.getRepository(Customer);
    const orgRepo = queryRunner.manager.getRepository(Site);
    const categoryRepo = queryRunner.manager.getRepository(CustomerCategory);
    const em = queryRunner.manager;

    // 1️⃣ Resolve CustomerCategory ahead of time if provided in the DTO
    let fetchedCategory: CustomerCategory | undefined = undefined;
    if (dto.customerCategoryId) {
      const category = await categoryRepo.findOne({
        where: { customerCategory: dto.customerCategoryId } // Matches column string mapping from your commented snippet
      });
      
      if (!category) {
        throw new Error(`CustomerCategory '${dto.customerCategoryId}' not found.`);
      }
      fetchedCategory = category;
    }

    let customer: Customer | null = null;

    if (dto.id) {
      // ----- EDIT MODE -----
     customer = await custRepo.findOne({ 
    where: { id: dto.id },
    relations: ['sites'] 
  });
      if (!customer) {
        throw new Error(`Customer with id ${dto.id} not found`);
      }

      if (customer.customerName !== dto.customerName) {
        await this.ensureNoDuplicate(dto.tenantId, dto.customerName, custRepo);
      }

      // Map scalar fields and attach the resolved relation block
      Object.assign(customer, {
        tenantId: dto.tenantId,
        customerName: dto.customerName,
        clientStatus: dto.clientStatus,
        leadSource: dto.leadSource,
        mobileNumber: dto.mobileNumber,
        EmailId: dto.EmailId,
        city: dto.city,
        creditDays: dto.creditDays,
        creditLimit: dto.creditLimit,
        createdByUserId: dto.createdByUserId,
        customerCategory: fetchedCategory || null // 👈 Directly updates or clears out old categories
      });

      const syncedOrgs = await this.syncSites(customer, dto.sites || [], orgRepo, em);
      await em.save(customer);customer.sites = syncedOrgs;

        const updatedCustomer = await custRepo.findOne({
  where: { id: dto.id },
  relations: ['sites', 'customerCategory']
});

if (ownsRunner) {
  await queryRunner.commitTransaction();
}

return updatedCustomer || customer;
    } else {
      // ----- ADD MODE -----
      await this.ensureNoDuplicate(dto.tenantId, dto.customerName, custRepo);

      customer = custRepo.create({
        tenantId: dto.tenantId,
        customerName: dto.customerName,
        clientStatus: dto.clientStatus,
        leadSource: dto.leadSource,
        mobileNumber: dto.mobileNumber,
        EmailId: dto.EmailId,
        city: dto.city,
        creditDays: dto.creditDays,
        creditLimit: dto.creditLimit,
        createdByUserId: dto.createdByUserId,
        customerCategory: fetchedCategory // 👈 Assigns the relation perfectly on creation
      });
      
      await em.save(customer);

      const sites = await Promise.all(
        (dto.sites || []).map(async (orgDto: any) => {
          return orgRepo.create({
            siteName: orgDto.siteName,
            contactPersonName: orgDto.contactPersonName,
            customer: customer!
          });
        })
      );

      await em.save(sites);
      customer.sites = sites;
    }

    if (ownsRunner) {
      await queryRunner.commitTransaction();
    }

    return customer;
  } catch (err) {
    if (ownsRunner) {
      await queryRunner.rollbackTransaction();
    }
    console.error('Error in createCustomer (add/edit):', err);
    throw err;
  } finally {
    if (ownsRunner) {
      await queryRunner.release();
    }
  }
}

//---xyz---
/**
 * Strict POST Action: Persists a brand new customer profile record along with its initial nested sites array.
 * @param dto Fresh data parameters from client.
 * @param manager Optional transactional EntityManager.
 */
async createCustomerClean(
  dto: CreateCustomerDto,
  manager?: EntityManager
): Promise<Customer> {
  const { runner: queryRunner, ownsRunner } = this.getQueryRunner(manager);

  if (ownsRunner) {
    await queryRunner.connect();
    await queryRunner.startTransaction();
  }

  try {
    const custRepo = queryRunner.manager.getRepository(Customer);
    const orgRepo = queryRunner.manager.getRepository(Site);
    const categoryRepo = queryRunner.manager.getRepository(CustomerCategory);
    const em = queryRunner.manager;

    // ❌ Protection: Erase client-supplied IDs to completely drop duplicate write sequence risks
    const { id, ...cleanDto } = dto;

    let fetchedCategory: CustomerCategory | undefined = undefined;
    if (cleanDto.customerCategoryId) {
      const category = await categoryRepo.findOne({
        where: { customerCategory: cleanDto.customerCategoryId }
      });
      if (!category) {
        throw new Error(`CustomerCategory '${cleanDto.customerCategoryId}' not found.`);
      }
      fetchedCategory = category;
    }

    await this.ensureNoDuplicate(cleanDto.tenantId, cleanDto.customerName, custRepo);

    const customer = custRepo.create({
      tenantId: cleanDto.tenantId,
      customerName: cleanDto.customerName,
      clientStatus: cleanDto.clientStatus || 'NewLead',
      leadSource: cleanDto.leadSource,
      mobileNumber: cleanDto.mobileNumber,
      EmailId: cleanDto.EmailId,
      city: cleanDto.city,
      creditDays: cleanDto.creditDays,
      creditLimit: cleanDto.creditLimit,
      createdByUserId: cleanDto.createdByUserId,
      customerCategory: fetchedCategory
    });
    
    await em.save(customer);

    const sites = await Promise.all(
      (cleanDto.sites || []).map(async (orgDto: any) => {
        return orgRepo.create({
          siteName: orgDto.siteName,
          contactPersonName: orgDto.contactPersonName,
          customer: customer
        });
      })
    );

    await em.save(sites);
    customer.sites = sites;

    if (ownsRunner) {
      await queryRunner.commitTransaction();
    }

    return customer;
  } catch (err) {
    if (ownsRunner) {
      await queryRunner.rollbackTransaction();
    }
    console.error('Error in createCustomerClean transactional routine:', err);
    throw err;
  } finally {
    if (ownsRunner) {
      await queryRunner.release();
    }
  }
}

/**
 * Strict PUT Action: Overwrites an existing customer profile record and synchronises child sites.
 * @param id The auto-increment primary key ID of the target customer record.
 * @param tenantId The validated tenant ID from the active security token context.
 * @param dto Data payload containing update values.
 * @param manager Optional transactional EntityManager.
 */
async updateCustomer(
  id: number,
  tenantId: number,
  dto: Partial<CreateCustomerDto>,
  manager?: EntityManager
): Promise<Customer> {
  const { runner: queryRunner, ownsRunner } = this.getQueryRunner(manager);

  if (ownsRunner) {
    await queryRunner.connect();
    await queryRunner.startTransaction();
  }

  try {
    const custRepo = queryRunner.manager.getRepository(Customer);
    const orgRepo = queryRunner.manager.getRepository(Site);
    const categoryRepo = queryRunner.manager.getRepository(CustomerCategory);
    const em = queryRunner.manager;

    // 🔒 Security Boundary: Lock record matching parameters directly inside tenant sandbox environments
    const customer = await custRepo.findOne({ 
      where: { id, tenantId },
      relations: ['sites'] 
    });
    if (!customer) {
      throw new Error(`Customer with id ${id} not found or unauthorized cross-tenant modification attempt.`);
    }

    let fetchedCategory: CustomerCategory | undefined = undefined;
    if (dto.customerCategoryId) {
      const category = await categoryRepo.findOne({
        where: { customerCategory: dto.customerCategoryId }
      });
      if (!category) {
        throw new Error(`CustomerCategory '${dto.customerCategoryId}' not found.`);
      }
      fetchedCategory = category;
    }

    if (dto.customerName && customer.customerName !== dto.customerName) {
      await this.ensureNoDuplicate(tenantId, dto.customerName, custRepo);
    }

    // Strip tracking parameters out of incoming client body contexts
    const { id: pId, tenantId: pTenantId, sites: pSites, ...updatableFields } = dto;

    Object.assign(customer, {
      ...updatableFields,
      customerCategory: fetchedCategory || customer.customerCategory
    });

    // Invoke your pre-built array synchronization module to handle cascading delta updates/removals
    const syncedOrgs = await this.syncSites(customer, dto.sites || [], orgRepo, em);
    await em.save(customer);
    customer.sites = syncedOrgs;

    if (ownsRunner) {
      await queryRunner.commitTransaction();
    }

    const updatedCustomer = await custRepo.findOne({
      where: { id },
      relations: ['sites', 'customerCategory']
    });

    return updatedCustomer || customer;
  } catch (err) {
    if (ownsRunner) {
      await queryRunner.rollbackTransaction();
    }
    console.error('Error in updateCustomer transactional context:', err);
    throw err;
  } finally {
    if (ownsRunner) {
      await queryRunner.release();
    }
  }
}


  /* ---------------------------------------------------------
     GET CUSTOMER BY ID – unchanged (keeps optional manager)
     --------------------------------------------------------- */
  async getCustomerById(
    tenantId: number,
    customerId: number,
    manager?: EntityManager
  ): Promise<Customer | null> {
    const repo = manager
      ? manager.getRepository(Customer)
      : this.customerRepository;
    return await repo.findOne({ where: { id: customerId } });
  }

  /* ---------------------------------------------------------
     GET One CUSTOMER FOR TENANT Customer – unchanged
     --------------------------------------------------------- */
  async getCustomer(
    tenantId: number,customerId:number,
    manager?: EntityManager
  ): Promise<Customer[]> {
    if (!this.customerRepository) {
      throw new Error(
        'CustomerService repository not initialized. Call init() first.'
      );
    }
    const repo = manager
      ? manager.getRepository(Customer)
      : this.customerRepository;

    //const customers = await repo.find({ where: { tenantId } ,relations:{sites:{customerCategory:true}} });
  const customers = await repo.find({ where: { tenantId, id:customerId },relations:['sites']  });
    return customers;
  }


  /* ---------------------------------------------------------
     GET ALL CUSTOMERS FOR TENANT – unchanged
     --------------------------------------------------------- */
  async getCustomers(
    tenantId: number,
    manager?: EntityManager
  ): Promise<Customer[]> {
    if (!this.customerRepository) {
      throw new Error(
        'CustomerService repository not initialized. Call init() first.'
      );
    }

    const repo = manager
      ? manager.getRepository(Customer)
      : this.customerRepository;

    //const customers = await repo.find({ where: { tenantId } ,relations:{sites:{customerCategory:true}} });
  const customers = await repo.find({ where: { tenantId },relations:['sites']  });
    return customers;
  }
}

    

export default CustomerService