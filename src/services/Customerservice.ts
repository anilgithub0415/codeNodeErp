
import { Repository,EntityManager , QueryRunner} from 'typeorm'; 
import { Customer } from "../entity/Customer";
import { getCustomerServiceRepository } from '../dependencies';



import { AppDataSource } from '../../data-source'; 
import { CustomerCategory } from '../entity/CustomerCategory';
import { Organisation } from '../entity/Organisation';
import { OrganisationDto } from '../dto/Customer.dto';

interface CreateCustomerDto{
    id:number;
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
  private orgRepository!: Repository<Organisation>;

        constructor() {
            // Constructor is lean, repository will be injected or set via init
        }
    
        /**
         * Initializes the TenantService with its TypeORM repository.
         * This MUST be called AFTER AppDataSource.initialize() has completed.
         * @param repo The TypeORM Repository instance for Tenant.
         */
        async init(customerRepo: Repository<Customer>,orgRepo: Repository<Organisation>): Promise<void> {
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
 * Synchronises the child collection of organisations for a given customer.
 *
 *  • New DTOs (no `id`) → create new Organisation rows.
 *  • Existing DTOs (have `id`) → update the matching rows.
 *  • Any Organisation that exists in the DB but is **not** present in the DTO
 *    array will be removed (cascade delete works if `onDelete: 'CASCADE'` is set).
 *
 * @param customer   The parent Customer entity (already persisted, has an id).
 * @param orgDtos    Array of DTOs received from the client.
 * @param orgRepo    Repository for the Organisation entity.
 * @param manager    EntityManager that belongs to the current transaction.
 *
 * @returns The list of Organisation entities that are now attached to the customer.
 */
private async syncOrganisations(
  customer: Customer,
  orgDtos: OrganisationDto[],
  orgRepo: Repository<Organisation>,
  manager: EntityManager
): Promise<Organisation[]> {
  // -------------------------------------------------
  // 1️⃣ Load the organisations that already belong to this customer
  // -------------------------------------------------
  const existingOrgs = await orgRepo.find({
    where: { customer: { id: customer.id } },
  });

  // -------------------------------------------------
  // 2️⃣ Build a map (id → Organisation) for quick lookup
  // -------------------------------------------------
  const existingMap = new Map<number, Organisation>();
  existingOrgs.forEach(org => existingMap.set(org.id, org));

  const result: Organisation[] = [];

  // -------------------------------------------------
  // 3️⃣ Iterate over the incoming DTOs
  // -------------------------------------------------
  for (const dto of orgDtos) {
    // ----- UPDATE path (dto has an id that matches an existing row) -----
    if (dto.id && existingMap.has(dto.id)) {
      const org = existingMap.get(dto.id)!; // guaranteed to exist
      // Copy only the fields that belong to the Organisation entity.
      // (If you have extra fields in the DTO, filter them out here.)
      Object.assign(org, {
        organisationName: dto.organisationName,
        contactPersonName: dto.contactPersonName,
        mobileNumber: dto.mobileNumber,
        EmailId: dto.EmailId,
        city: dto.city,
        Remarks: dto.Remarks,
      });

      // If the category changed we need to fetch the new CustomerCategory entity.
      if (dto.customerCategory) {
        const category = await manager
          .getRepository(CustomerCategory)
          .findOne({ where: { customerCategory: dto.customerCategory } });

        if (!category) {
          throw new Error(
            `CustomerCategory  ${dto.customerCategory} not found`
          );
        } 
        (org as any).customerCategory = category; // assign relation
      }

      await manager.save(org); // persists updates
      result.push(org);
      existingMap.delete(dto.id); // mark as processed → will not be deleted
    } else {
      // ----- CREATE path (new organisation) -----
      // Resolve the CustomerCategory relation (required for the FK)
      const category = await manager
        .getRepository(CustomerCategory)
        .findOne({ where: { customerCategory: dto.customerCategory } });

      if (!category) {
        throw new Error(
          `CustomerCategory id ${dto.customerCategory} not found`
        );
      }

      const newOrg = orgRepo.create({
        organisationName: dto.organisationName,
        contactPersonName: dto.contactPersonName,
        mobileNumber: dto.mobileNumber,
        EmailId: dto.EmailId,
        city: dto.city,
        Remarks: dto.Remarks,
        customer,               // set the back‑reference (FK to Customer)
        customerCategory: category, // set the relation to CustomerCategory
      });

      await manager.save(newOrg);
      result.push(newOrg);
    }
  }

  // -------------------------------------------------
  // 4️⃣ DELETE organisations that were removed on the client side
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
    const orgRepo = queryRunner.manager.getRepository(Organisation);
    const em = queryRunner.manager; // same EntityManager for the whole tx

    // -------------------------------------------------
    // 1️⃣ Determine mode (add vs edit) – **always use id**
    // -------------------------------------------------
    let customer: Customer | null = null;

    if (dto.id) {
      // ----- EDIT mode -------------------------------------------------
      customer = await custRepo.findOne({ where: { id: dto.id } });
      if (!customer) {
        throw new Error(`Customer with id ${dto.id} not found`);
      }

      // Update scalar fields – name can be changed freely
      customer.tenantId = dto.tenantId;
      customer.customerName = dto.customerName;

      // Sync organisations (add / update / delete)
      const syncedOrgs = await this.syncOrganisations(
        customer,
        dto.organisations,
        orgRepo,
        em
      );
      customer.organisations = syncedOrgs;

      await em.save(customer); // persists both customer & org changes
    } else {
      // ----- ADD mode --------------------------------------------------
      // Optional: prevent duplicate name within the same tenant
      await this.ensureNoDuplicate(dto.tenantId, dto.customerName, custRepo);

      // Create the brand‑new customer
      customer = custRepo.create({
        tenantId: dto.tenantId,
        customerName: dto.customerName,
      });
      await em.save(customer); // get generated id

      // Create organisations linked to the new customer
      const organisations = dto.organisations.map((orgDto:any) =>
        orgRepo.create({ ...orgDto, customer })
      );
      await em.save(organisations);
      customer!.organisations = organisations;
    }

    // -------------------------------------------------
    // 2️⃣ Commit (only if we started the transaction)
    // -------------------------------------------------
    if (ownsRunner) {
      await queryRunner.commitTransaction();
    }

    return customer!;
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

    const customers = await repo.find({ where: { tenantId } ,relations:{organisations:true} });
    console.log('customers count:', customers.length);
    return customers;
  }
}

    

export default CustomerService