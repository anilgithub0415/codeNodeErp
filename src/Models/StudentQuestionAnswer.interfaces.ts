export interface StudentQuestionAnswer {
    id:number;
    tenantId?: string;
    assignmentAttemptId?: number;
    questionId?: number;
    studentAnswerContent?: string;
    isCorrect?: boolean;
    scoreEarned?: number;
    teacherFeedback?: string;
    
}
