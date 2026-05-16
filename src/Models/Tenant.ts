//import { Tenant, TenantType, SubscriptionPlan } from '../entity/Tenant'; // Import the Tenant entity and enums
import { Tenant } from '../entity/Tenant'; // Import the Tenant entity and enums
//import { userRole } from '../entity/User'; // Import the UserRole enum

// You might also define an interface for the Tenant model if you want to explicitly use it in User
export interface TenantModel {
    tenantId: string;
    tenantName: string;
    tenantType: string;
    subscriptionPlan: string;
    subscriptionEndDate?: Date | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
// 2. CreateTenantDto (for data sent to backend when creating a new tenant)
export interface CreateTenantDto {
    tenantName: string;
    tenantType: string; // Changed to string
    subscriptionPlan?: string; // Changed to string, still optional
    autocodeConfig?:string|null;
}

// 3. UpdateTenantDto (for data sent to backend when updating an existing tenant)
export type UpdateTenantDto = Partial<Omit<Tenant,
    'tenantId' | 'createdAt' | 'updatedAt'
>>;
// The properties tenantType and subscriptionPlan will implicitly be 'string' due to Omit<Tenant, ...>
// and Partial<...>, as they are strings in the base Tenant interface.