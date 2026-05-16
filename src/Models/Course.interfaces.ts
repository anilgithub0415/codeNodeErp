
// We can import the same DTO interfaces from the frontend or define them here.
// Defining them here is a good practice for backend-specific validation, etc.
export interface CreateCourseDto {
    tenantId: string;
    courseCode: string;
    courseName: string;
    description?: string | null;
    credits?: number | null;
    subjectId: number;
    isActive?: boolean;
  }
  
/**
 * Data Transfer Object for updating an existing Course.
 * All properties are optional, which allows for partial updates.
 * This is a common and flexible pattern for PUT or PATCH endpoints.
 */
export interface UpdateCourseDto {
    tenantId?: string;
    courseCode?: string;
    courseName?: string;
    description?: string | null;
    credits?: number | null;
    subjectId?: number;
    isActive?: boolean;
}