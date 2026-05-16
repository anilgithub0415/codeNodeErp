// The DTOs for the request body that your Node.js endpoint receives
export interface CreateStudentCourseOfferingDto {
    courseOfferingId: number;
    studentProfileId: number;
    assignmentDate?: Date; 
    status?: string; 
}

export interface CreateStudentEnrollmentDto {
    tenantId: string;
    studentProfileId: number;
    PersonId?:number;
    programId: number;
    enrollmentDate: Date; // Use Date objects on the backend
    status: string;
    completionDate?: Date | null;
    studentCourseOfferings: CreateStudentCourseOfferingDto[];
    createdByUserId?:number;
}