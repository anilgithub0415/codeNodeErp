import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Tenant } from './Tenant';
import { QuestionTypeLookup } from './QuestionTypeLookup';
import { QuestionCategoryLookup } from './QuestionCategoryLookup';
// import { Subject } from './Subject'; // REMOVED: No longer directly linked here
import { AssignmentQuestion } from './AssignmentQuestion';
import { Topic } from './Topic';
import { QuestionExamTypes } from './QuestionExamTypes';
import { StudentQuestionAnswer } from './StudentQuestionAnswer';
import { QuestionPurposeLookup } from './QuestionPurposeLookup';
import { Option } from './Option';

@Entity({ name: 'Question' })
export class Question {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'nvarchar', length: 255, nullable: true, name: 'TenantId' })
    tenantId!: string;

    @ManyToOne(() => Tenant, tenant => tenant.questions)
    @JoinColumn({ name: 'TenantId' })
    tenant!: Tenant;

    @Column({ type: 'nvarchar', length: 'MAX', nullable: false })
    questionText!: string;

    // @Column({ type: 'nvarchar', length: 'MAX', nullable: true })
    // options?: string | null;

    @OneToMany(() => Option, option => option.question)
options?: Option[];

    @Column({ type: 'nvarchar', length: 'MAX', nullable: true })
    correctAnswer?: string | null;

    @Column({ type: 'int', nullable: true })
    defaultPoints?: number | null;

    @Column({ type: 'nvarchar', length: 'MAX', nullable: true })
    explanation?: string | null;

    @Column({ type: 'nvarchar', length: 50, nullable: false, name: 'QuestionTypeName' })
    questionTypeName!: string;

    @ManyToOne(() => QuestionTypeLookup, qType => qType.Questions, { onDelete: 'CASCADE' }) //earlier was RESTRICT // Changed back to RESTRICT for lookup tables
    @JoinColumn({ name: 'QuestionTypeName', referencedColumnName: 'typeName' })
    questionType!: QuestionTypeLookup;

    @Column({ type: 'nvarchar', length: 50, nullable: false, name: 'QuestionCategoryName' })
    questionCategoryName!: string;

    @ManyToOne(() => QuestionCategoryLookup, qCategory => qCategory.Questions, { onDelete: 'CASCADE' })//Earlier was RESTRICT // Changed back to RESTRICT for lookup tables
    @JoinColumn({ name: 'QuestionCategoryName', referencedColumnName: 'categoryName' })
    questionCategory!: QuestionCategoryLookup;

     // --- NEW COLUMN: for the PURPOSE/ASSIGNMENT category (e.g., 'Homework', 'Quiz') ---
     @Column({ type: 'nvarchar', length: 50, nullable: false, name: 'QuestionPurposeName' })
     questionPurposeName!: string;
 
     @ManyToOne(() => QuestionPurposeLookup, qPurpose => qPurpose.Questions, { onDelete: 'CASCADE' })
     @JoinColumn({ name: 'QuestionPurposeName', referencedColumnName: 'purposeName' })
     questionPurpose!: QuestionPurposeLookup;
     // --- END NEW COLUMN ---

    @Column({ type: 'int', nullable: true, name: 'TopicId' })
    topicId?: number | null;
        

    @ManyToOne(() => Topic, topic => topic.questions, { onDelete: 'SET NULL' }) // If topic is deleted, set to null
    @JoinColumn({ name: 'TopicId' })
    topic?: Topic | null;
    
    
    @Column({ type: 'int', nullable: true, name: 'sourceQuestionId' })
    sourceQuestionId?: number | null;

    // --- REMOVED: Direct SubjectId column and ManyToOne relationship ---
    // @Column({ type: 'int', nullable: true, name: 'SubjectId' })
    // subjectId?: number | null;
    // @ManyToOne(() => Subject, subject => subject.questions, { onDelete: 'SET NULL' })
    // @JoinColumn({ name: 'SubjectId' })
    // subject?: Subject | null;
    // --- END REMOVED ---

    @Column({ type: 'bit', default: true })
    isActive!: boolean;

    @OneToMany(() => AssignmentQuestion, aq => aq.question)
    assignmentQuestions?: AssignmentQuestion[];

    @OneToMany(() => QuestionExamTypes, qet => qet.question)
    questionExamTypes?: QuestionExamTypes[];
    
    @OneToMany(() => StudentQuestionAnswer, sqa => sqa.question)
    studentQuestionAnswers?: StudentQuestionAnswer[];
    
    @CreateDateColumn({ type: 'datetime2', name: 'CreatedAt' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'datetime2', name: 'UpdatedAt' })
    updatedAt!: Date;
}