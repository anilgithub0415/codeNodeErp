import { Tenant } from '../entity/Tenant'; // Import the Tenant entity and enums
import { UserRoleLookup } from '../entity/UserRoleLookup';
//import { userRole } from '../entity/User'; // Import the UserRole enum

export interface User {
    id: number;
    // --- NEW: Tenant ID and optional Tenant object ---
    tenantId: string; // The ID of the tenant this user record belongs to
    // tenant?: TenantModel; // Optional: If you plan to eager-load the full tenant object
                           // and pass it in your API responses, include this.
                           // Otherwise, just tenantId is often sufficient for most operations.
    // --- END NEW ---

    UserName: string; // This is typically the email address
    DisplayName?: string | null; // Made nullable to match entity

    // password: string; // NEVER send this back to the client.
                      // If this interface represents API response, exclude password.
                      // If it represents internal data model, keep it.
                      // Given comment "NEVER send this back to the client",
                      // I will remove it from this *API-response-like* interface.
                      // For internal data processing, you'd use the TypeORM entity directly.
                      password:string;
    Role: UserRoleLookup; // Use the UserRole enum for type safety
    isActive: boolean;
    isEmailVerified?: boolean | undefined;
    verificationToken?: string | undefined | null;
    verificationTokenExpiresAt?: Date | undefined | null;

    // --- NEW: Google ID (nullable) ---
    googleId?: string | null;
    // --- END NEW ---
}