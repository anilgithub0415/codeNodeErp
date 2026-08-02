
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

        // Inside your service classprivate 
        private async ensureNoDuplicate(
  tenantId: number, 
  customerName: string, 
  transactionalRepo: Repository<Customer>
): Promise<void> {

  // 1️⃣ Strict Application Guard Rails
  if (!tenantId || !customerName) {
    throw new Error("Validation Failed: tenantId and customerName are required parameters.");
  }

  console.log('checking alexists:',customerName);
  
  // 2️⃣ Use Query Builder to stop TypeORM from returning the first record on undefined keys
  const existingCustomer = await transactionalRepo
    .createQueryBuilder("customer")
    .where("customer.tenantId = :tenantId", { tenantId })
    .andWhere("customer.customerName = :customerName", { customerName: customerName.trim() })
    .getOne(); // 💡 Safe method that returns null if no rows exactly match parameters

  // 3️⃣ Exact Property Proof Check
  if (existingCustomer) {
    throw new Error(`The customer name '${customerName}' already exists inside this tenant context.`);
  }
}



        //we are not allowing duplicate(repeat) customername in tenant
        private async ensureNoDuplicatePreserve(
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

        
private async syncSites_2(
  customer: Customer,
  orgDtos: SiteDto[],
  tenantId: number, // 🔒 Injected verified security parameter boundary
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
  console.log('Syncing org site models:', orgDtos);

  // -------------------------------------------------
  // 3️⃣ Iterate over the incoming DTOs
  // -------------------------------------------------
  for (const dto of orgDtos) {
    
    // ----- UPDATE path (dto has an id that matches an existing row) -----
    if (dto.id && existingMap.has(dto.id)) {
      const site = existingMap.get(dto.id)!; 

      // Update structural fields safely using the verified method parameters
      Object.assign(site, {
        siteName: dto.siteName,
        siteContactPerson: dto.siteContactPerson,
        customer: customer, // 🌟 FIX: Binds the Client relation to avoid 'Cannot insert NULL into ClientId'
        tenantId: tenantId  // 🌟 FIX: Replaces the broken 'ptenantId' reference safely
      });

      await manager.save(site); 
      result.push(site);
      existingMap.delete(dto.id); 
    } 
    // ----- CREATE path (new organisation) -----
    else {
      const newOrg = orgRepo.create({
        siteName: dto.siteName,
        siteContactPerson: dto.siteContactPerson,
        customer: customer, // 🌟 FIX: Automatically writes the parent ClientId parameter column
        tenantId: tenantId  // 🌟 FIX: Overrides incoming DTO values with verified sandbox integers
      });

      await manager.save(newOrg);
      result.push(newOrg);
    }
  }

  // -------------------------------------------------
  // 4️⃣ DELETE sites that were removed on the client side
  // -------------------------------------------------
  // -------------------------------------------------
  // 4️⃣ DELETE sites that were removed on the client side
  // -------------------------------------------------
  const toDelete = Array.from(existingMap.values());
  if (toDelete.length) {
    console.log(`Purging ${toDelete.length} child site records and clearing constraints...`);

    // 🌟 FIX STEP A: Gather all unique IDs from the sites being dropped
    const siteIdsToDelete = toDelete.map(site => site.id);

    // 🌟 FIX STEP B: Direct-delete dependent rows out of UserTenantContext table first
    // This cleans up the foreign key blockers so SQL Server allows the main delete to finish
    await manager.createQueryBuilder()
      .delete()
      .from('UserTenantContext')
      // Adjust column name below if the link column is named 'siteId' or 'clientId' instead of 'userId'
      .where('siteId IN (:...ids)', { ids: siteIdsToDelete }) 
      .execute();

    // 🌟 FIX STEP C: Now the parent deletion will process cleanly without triggering Error 547
    await manager.remove(toDelete);
  }


  // -------------------------------------------------
  // 5️⃣ Return the final collection (now in sync with the DTO)
  // -------------------------------------------------
  return result;
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
// Inside your service class (e.g., CustomerService)
// Ensure siteDtos is typed as an array of partial objects
async syncSites(
  customer: Customer,
  siteDtos: Partial<Site>[], 
  tenantId: number,
  orgRepo: Repository<Site>,
  em: EntityManager
): Promise<Site[]> {
  const updatedSites: Site[] = [];

  for (const singleSiteDto of siteDtos) { 
    let site: Site | null = null;
    const siteId = singleSiteDto.id ? Number(singleSiteDto.id) : null;

    if (siteId && siteId > 0) {
      site = await orgRepo.findOneBy({ id: siteId, tenantId });
      if (!site) throw new Error(`Site with ID ${siteId} not found under tenant context.`);
      
      Object.assign(site, singleSiteDto);
    } else {
      // 🌟 FIX: Explicitly inject tenantId directly into the factory instantiation properties block
      site = orgRepo.create({
        ...singleSiteDto,
        tenantId: tenantId // Guarantees tenant context mapping is built immediately
      }); 
    }

    // 🌟 RE-ENFORCE: Hard bindings applied to entity properties prior to execution pipeline emission 
    site.tenantId = tenantId; 
    site.clientId = customer.id; 
    site.customer = customer;    

    const savedSite = await em.save(Site, site);
    updatedSites.push(savedSite);
  }

  return updatedSites;
}






private async syncSites_preserved(
  customer: Customer,   // 🌟 Contains the true parent database clientId (customer.id)
  orgDtos: SiteDto[],
  tenantId: number,     // 🔒 Multi-tenant isolation parameter
  orgRepo: Repository<Site>,
  manager: EntityManager
): Promise<Site[]> {
  // 1️⃣ Load the sites that already belong to this customer
  const existingOrgs = await orgRepo.find({
    where: { customer: { id: customer.id } },
  });

  // 2️⃣ Build a map for quick lookups
  const existingMap = new Map<number, Site>();
  existingOrgs.forEach(site => existingMap.set(site.id, site));

  const result: Site[] = [];

  // 3️⃣ Iterate over incoming payloads
  for (const dto of orgDtos) {
    
    // ----- UPDATE path (Modifying an existing row) -----
    if (dto.id && existingMap.has(dto.id)) {
      const site = existingMap.get(dto.id)!; 

      Object.assign(site, {
        siteName: dto.siteName,
        siteContactPerson: dto.siteContactPerson,
        customer: customer, // 🌟 FIX: Sets the parent relationship (writes to ClientId column)
        tenantId: tenantId  // 🌟 FIX: Sets multi-tenant tracking safely
      });

      await manager.save(site); 
      result.push(site);
      existingMap.delete(dto.id); 
    } 
    // ----- CREATE path (Inserting a brand new row) -----
    else {
      const newOrg = orgRepo.create({
        siteName: dto.siteName,
        siteContactPerson: dto.siteContactPerson,
        customer: customer, // 🌟 FIX: Binds the new site to the active parent customer record
        tenantId: tenantId  // 🌟 FIX: Prevents tenant parameter leaks
      });

      await manager.save(newOrg);
      result.push(newOrg);
    }
  }

  // 4️⃣ DELETE sites dropped by the UI
  const toDelete = Array.from(existingMap.values());
  if (toDelete.length) {
    await manager.remove(toDelete);
  }

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

  console.log('....................................method:createCustomer................................');
  
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
        commercialContactPhone: dto.commercialContactPhone,
        EmailId: dto.EmailId,
        city: dto.city,
        creditDays: dto.creditDays,
        creditLimit: dto.creditLimit,
        createdByUserId: dto.createdByUserId,
        customerCategory: fetchedCategory || null // 👈 Directly updates or clears out old categories
      });

      const syncedOrgs = await this.syncSites(customer, dto.sites || [],dto.tenantId, orgRepo, em);
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
        commercialContactPhone: dto.commercialContactPhone,
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
            siteContactPerson: orgDto.siteContactPerson,
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

  console.log('....................................method:createCustomerClean................................');
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

    // Inside your createCustomerClean method:
await this.ensureNoDuplicate(cleanDto.tenantId, cleanDto.customerName, custRepo);

 


    const customer = custRepo.create({
      tenantId: cleanDto.tenantId,
      customerName: cleanDto.customerName,
      clientStatus: cleanDto.clientStatus || 'NewLead',
      leadSource: cleanDto.leadSource,
      commercialContactPhone: cleanDto.commercialContactPhone,
      EmailId: cleanDto.EmailId,
      city: cleanDto.city,
      creditDays: cleanDto.creditDays,
      creditLimit: cleanDto.creditLimit,
      createdByUserId: cleanDto.createdByUserId,
      customerCategory: fetchedCategory
    });
    
   // Inside your createCustomerClean method:

    await em.save(customer);

    const sites = await Promise.all(
      (cleanDto.sites || []).map(async (orgDto: any) => {
        return orgRepo.create({
          siteName: orgDto.siteName,
          siteContactPerson: orgDto.siteContactPerson,
          customer: customer,
          // 🌟 FIX: Explicitly bind the mandatory tenant identity parameter here
          tenantId: cleanDto.tenantId 
        });
      })
    );

    await em.save(sites); // SQL Server handles this cleanly now!
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

  console.log('....................................method:updateCustomer................................');
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
    // Strip tracking parameters out of incoming client body contexts
    const { id: pId, tenantId: pTenantId, sites: pSites, ...updatableFields } = dto;

    Object.assign(customer, {
      ...updatableFields,
      customerCategory: fetchedCategory || customer.customerCategory
    });

    // 🌟 FIX 1: Explicitly persist the customer root entity changes FIRST
    await em.save(customer);

    // 🌟 FIX 2: Explicitly pass the resolved parent ID inside your child loop array
    const syncedOrgs = await this.syncSites(customer, dto.sites || [], tenantId, orgRepo, em);

    // Rebind the updated structural reference array context
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
  tenantId: number, 
  customerId: number,
  manager?: EntityManager
): Promise<Customer | null> { // 💡 FIX: Return single object type or null
  if (!this.customerRepository) {
    throw new Error(
      'CustomerService repository not initialized. Call init() first.'
    );
  }
  const repo = manager
    ? manager.getRepository(Customer)
    : this.customerRepository;

  // 💡 FIX: Replaced .find() with .findOne() to pull a single database record
  const customer = await repo.findOne({ 
    where: { tenantId, id: customerId },
    relations: ['sites','users']  
  });
  
  return customer;
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