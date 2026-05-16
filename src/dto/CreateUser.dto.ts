import { User } from "../entity/User";

export interface RegisterAndSubscribeDto {
    userName: string; // Email
    password: string;
    displayName: string;

    // Tenant creation fields
    tenantName: string; // Name of the institute/classroom/solo space
    tenantType: 'INSTITUTE' | 'INDIVIDUAL_STUDENT' | 'INDIVIDUAL_TEACHER' ; // TenantType; // Selected by user (e.g., 'Institute', 'IndividualTeacher')
    subscriptionPlan: 'Free'| 'Basic' | 'Premium';// SubscriptionPlan; // Initial plan (e.g., 'Free', 'Basic')
   // roleName:'InstititeAdmin'|'Student'|'Teacher'
    // Dynamic fields from the form (these will be stored on the User or Tenant entity,
    // depending on your backend's design. For simplicity, we'll assume they map to User properties
    // or are handled by the backend based on tenantType.)
    firstName: string;
    lastName?: string;
    contactEmail: string;
    contactPhone?: string;
    deviceInfo?: string; // Optional: Device info for initial login token
    
    [key: string]: any; 
}

export interface CreateUserDto {
    tenantId:string;
    userName: string; // Email
    displayName:string;
    password: string;
    role:string;
    isActive:boolean;
    isEmailVerified:boolean;
    

    [key: string]: any; 
}

export type UpdateUserDTO = Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'refreshTokens' | 'tenant'>> & {
      password?: string;
      roleNameInContext?:string;
      activeTenantId?:string;
      
};