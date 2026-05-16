
// We can import the same DTO interfaces from the frontend or define them here.
// Defining them here is a good practice for backend-specific validation, etc.


  export interface CreateSubjectDto {
    tenantId: string;
    subjectCode: string;
    subjectName: string;
    isActive?: boolean;
  }
  export interface UpdateSubjectDto{
    tenantId: string;
    subjectCode: string;
    subjectName: string;
    isActive?: boolean;
  }