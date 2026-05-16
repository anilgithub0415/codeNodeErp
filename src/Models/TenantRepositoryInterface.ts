import { Tenant } from "../entity/Tenant";

export interface TenantRepositoryInterface {
    save(Tenant: Tenant): Promise<Tenant>;
    getById(id: string): Promise<Tenant | undefined>;
    getAll(): Promise<Tenant[]>;
  }
  
 