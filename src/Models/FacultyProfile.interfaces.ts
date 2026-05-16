/**
 * Data Transfer Object for creating a new FacultyProfile.
 * This DTO defines the expected structure of the request body
 * when a client wants to create a new faculty profile.
 *
 * - `personId`: The ID of the associated Person entity. This is crucial for linking.
 * - `tenantId`: The ID of the tenant this faculty profile belongs to.
 * - Excludes auto-generated fields (`id`, `createdAt`, `updatedAt`).
 * - Excludes complex relations (`person`, `tenant`, `courseOfferings`).
 */
export interface CreateFacultyProfileDto {
    tenantId: string;
    personId: number; // Link to the Person entity
    employeeIdNumber?: string | null;
    department?: string | null;
    designation?: string | null;
    isActive?: boolean; // Defaults to true on the entity, but can be provided
  }
  
  /**
   * Data Transfer Object for updating an existing FacultyProfile.
   * Using `Partial<CreateFacultyProfileDto>` makes all fields optional,
   * allowing for partial updates (e.g., changing only the department).
   * It also explicitly omits `personId` and `tenantId` as these typically
   * should not be changed after creation for a profile.
   */
  export type UpdateFacultyProfileDto = Partial<Omit<CreateFacultyProfileDto, 'personId' | 'tenantId'>>;
  
  
  /**
   * Data Transfer Object representing a full FacultyProfile record as it might be
   * returned by your API (e.g., after creation, update, or retrieval).
   * This includes auto-generated fields like `id`, `createdAt`, `updatedAt`.
   *
   * Note: While the entity has `person` and `tenant` relations, the DTO typically
   * only includes the foreign key IDs unless a specific API endpoint is designed
   * to "expand" these relations.
   */
  export interface FacultyProfile {
    id: number;
    tenantId: string;
    personId: number;
    employeeIdNumber: string | null;
    department: string | null;
    designation: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }