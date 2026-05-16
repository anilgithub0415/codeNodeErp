// src/dto/tenant.dto.ts

// This DTO represents the shape of the data received from the client for creating a tenant
export interface BackendCreateTenantDto {
    tenantName: string;
    tenantType: string; // Expects the string name, e.g., 'Institute'
    subscriptionPlan?: string; // Expects the string name, e.g., 'Free'
    // Other fields if directly settable on create (e.g., isActive might be defaulted by service)
    isActive?: boolean; // Frontend might send this, backend service will handle default
    subscriptionEndDate?: Date | null; // Frontend might send this, backend service will handle
}

// This DTO represents the shape of the data received from the client for updating a tenant
// All fields are optional because it's a partial update
export interface BackendUpdateTenantDto {
    tenantName?: string;
    tenantType?: string; // Optional string name
    subscriptionPlan?: string; // Optional string name
    subscriptionEndDate?: Date | null;
    isActive?: boolean;
}