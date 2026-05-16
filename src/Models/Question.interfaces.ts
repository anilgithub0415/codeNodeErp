
// This is a DTO for creating questions that do NOT have separate options
// (e.g., Descriptive, Numerical).
export interface CreateBaseQuestionDto {
    tenantId: string;
    questionText: string;
    correctAnswer?: string | null;
    defaultPoints?: number | null;
    explanation?: string | null;
    questionTypeName: string;
    questionCategoryName: string;
    questionPurposeName: string;
    topicId?: number | null;
    isActive?: boolean;
}

// This DTO includes options and is for the transactional service.
// (This is what you're currently using that causes the error).
export interface CreateQuestionWithDetailsDto extends CreateBaseQuestionDto {
    options?: (CreateOptionDto | undefined)[] | undefined;
}

export interface option{
    optionText: string;
    isCorrect: boolean;
}

/**
 * DTO for creating a new Option.
 */
export interface CreateOptionDto {
    questionId?:number;
    optionText: string;
    isCorrect: boolean;
    createdAt?:Date;
    updatedAt?:Date;
}
export interface UpdateOptionDto{
    
    questionId?:number;
    optionText: string;
    isCorrect: boolean;
    createdAt?:Date;
    updatedAt?:Date;
}
/**
 * DTO for creating a new Question.
 * This is the structure your API would expect for a POST request.
 * It contains all required fields, but excludes auto-generated fields like `id`, `createdAt`, `updatedAt`.
 */
export interface CreateQuestionDto {
    tenantId: string;
    questionText: string;
    options?: CreateOptionDto[];
    correctAnswer?: string | null;
    defaultPoints?: number | null;
    explanation?: string | null;
    questionTypeName: string;
    questionCategoryName: string;
    questionPurposeName: string;
    topicId?: number | null;
    isActive?: boolean; // Matching the optional isActive from your CreateCourseDto
}

/**
 * DTO for updating an existing Question.
 * All properties are optional, which allows for partial updates via PUT or PATCH requests.
 * This is a common and flexible pattern.
 */
export interface UpdateQuestionDto {
    tenantId?: string;
    questionText?: string;
    options?: any;
    correctAnswer?: string | null;
    defaultPoints?: number | null;
    explanation?: string | null;
    questionTypeName?: string;
    questionCategoryName?: string;
    questionPurposeName?: string;
    topicId?: number | null;
    isActive?: boolean;
}