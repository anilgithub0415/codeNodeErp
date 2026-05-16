/**
 * Data Transfer Object for creating a new CourseOffering.
 * This DTO defines the expected structure of the request body
 * when a client wants to create a new course offering.
 *
 * - Includes all required fields for creation.
 * - Uses foreign key IDs (`tenantId`, `courseId`, `facultyProfileId`) instead of full related objects.
 * - Excludes auto-generated fields (`id`, `createdAt`, `updatedAt`, `enrolledStudentsCount`).
 * `enrolledStudentsCount` is typically managed by the backend (e.g., via service logic or database triggers).
 */
export interface CreateCourseOfferingDto {
    tenantId: string;
    courseId: number;
    facultyProfileId?: number | null; // Nullable if instructor can be assigned later
    offeringName: string;
    startDate?: Date | null;
    endDate?: Date | null;
    schedule?: string | null;
    location?: string | null;
    capacity?: number | null;
    isActive?: boolean; // Defaults to true on the entity, but can be provided
  }
  
  /**
   * Data Transfer Object for updating an existing CourseOffering.
   * Using `Partial<CreateCourseOfferingDto>` makes all fields optional,
   * allowing for partial updates.
   *
   * - Explicitly omits `tenantId` and `courseId` as these typically
   * should not be changed after creation for a course offering.
   */
  export type UpdateCourseOfferingDto = Partial<Omit<CreateCourseOfferingDto, 'tenantId' | 'courseId'>>;
  
  /**
   * Data Transfer Object representing a full CourseOffering record as it might be
   * returned by your API (e.g., after creation, update, or retrieval).
   *
   * - Includes all database columns, including auto-generated ones.
   * - Related collections (`assignments`, `studentCourseOfferings`) are typically
   * omitted here as they are usually fetched separately or are large.
   */
  export interface CourseOffering {
    id: number;
    tenantId: string;
    courseId: number;
    facultyProfileId: number | null;
    offeringName: string;
    startDate: Date | null;
    endDate: Date | null;
    schedule: string | null;
    location: string | null;
    capacity: number | null;
    enrolledStudentsCount: number | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }
  