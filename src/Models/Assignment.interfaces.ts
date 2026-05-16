
// A simple interface for the question-assignment relationship.
// This is typically defined as a separate entity in the database.
export interface QuestionAssignment {
    questionId: number;
    points: number;
    orderInAssignment:number;
  }
  
  // DTO for creating a new Assignment on the backend.
  export interface CreateAssignmentDto {
    id:number;
    tenantId: string;
    assignmentName: string;
    description?: string | null;
    dueDate: Date;
    visibilityDate: Date;CourseOfferingId?:number;
    assignmentPurpose:string;
    assignmentQuestions: QuestionAssignment[];
    quizTimeLimitSeconds:number;
    questionTimeLimitSeconds:number;
  }
  
  // DTO for updating an existing Assignment on the backend.
  export interface UpdateAssignmentDto {
    tenantId?: string;
    assignmentName?: string;
    description?: string | null;
    dueDate?: Date;
    visibilityDate?: Date;
    assignmentPurpose?:string;
    assignmentQuestions?: QuestionAssignment[];
    quizTimeLimitSeconds:number;
    questionTimeLimitSeconds:number;
  }