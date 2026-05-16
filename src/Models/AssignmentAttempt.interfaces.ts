import { StudentQuestionAnswer } from './StudentQuestionAnswer.interfaces';

/**
 * Data Transfer Object for creating a new AssignmentAttempt.
 * This is what your create endpoint will expect in the request body.
 */
export interface CreateAssignmentAttemptDto {
  tenantId: string;
  studentProfileId: number;
  assignmentId: number;
  submissionDate: Date;
  status?: string | null;
  studentQuestionAnswers: StudentQuestionAnswer[];
}

/**
 * Data Transfer Object for updating an existing AssignmentAttempt.
 * All properties are optional, which allows for partial updates.
 */
export interface UpdateAssignmentAttemptDto {
  tenantId?: string;
  studentProfileId?: number;
  assignmentId?: number;
  submissionDate?: Date;
  score?: number | null;
  status?: string | null;
  feedback?: string | null;
  submissionContentUrl?: string | null;
  studentQuestionAnswers?: StudentQuestionAnswer[];
}