import { Program } from '../entity/Program';
import { Course } from '../entity/Course';
import { Tenant } from '../entity/Tenant';

// --- DTO for creating a new ProgramCourse ---
// The `tenantId` is typically passed as part of the request body or extracted from the request headers.
export interface CreateProgramCourseRequestDto {
    programId: number;
    courseId: number;
    tenantId: string;
    orderInProgram?: number;
}


// --- DTO for updating an existing ProgramCourse ---
// All fields are optional here to support partial updates.
export interface UpdateProgramCourseRequestDto {
    programId?: number;
    courseId?: number;
    tenantId?: string;
    orderInProgram?: number;
}


// --- The full TypeORM entity to be used within services ---
// This is your entity, but it's good practice to have it in a shared place.
export interface ProgramCoursesEntity {
    id?: number;
    tenantId: string;
    programId: number;
    program?: Program;
    courseId: number;
    course?: Course;
    orderInProgram?: number | null;
    createdAt?: Date;
    updatedAt?: Date;
}