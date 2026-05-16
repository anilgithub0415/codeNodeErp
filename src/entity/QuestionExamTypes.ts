import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Unique } from 'typeorm';
import { Question } from './Question'; // Import Question entity
import { ExamType } from './ExamType'; // Import ExamType entity
import { Tenant } from './Tenant'; // Import Tenant entity


// A question can be associated with an exam type only once within a tenant
@Unique("UQ_QuestionExamType_Tenant", ["questionId", "examTypeId", "tenantId"])
@Entity({ name: 'QuestionExamTypes' })
export class QuestionExamTypes {
    @PrimaryGeneratedColumn()
    id!: number;

    // --- Tenant ID for multi-tenancy ---
    // This junction record belongs to the same tenant as its Question.
    @Column({ type: 'nvarchar', length: 255, nullable: false, name: 'TenantId' })
    tenantId!: string;

    @ManyToOne(() => Tenant, tenant => tenant.questionExamTypes)
    @JoinColumn({ name: 'TenantId' })
    tenant!: Tenant;
    // --- End Tenant ID ---

    // Many-to-One relationship with Question
    @Column({ type: 'int', nullable: false, name: 'QuestionId' })
    questionId!: number;

    @ManyToOne(() => Question, question => question.questionExamTypes, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'QuestionId' })
    question!: Question;

    // Many-to-One relationship with ExamType
    @Column({ type: 'int', nullable: false, name: 'ExamTypeId' })
    examTypeId!: number;

    @ManyToOne(() => ExamType, examType => examType.questionExamTypes, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'ExamTypeId' })
    examType!: ExamType;

    @CreateDateColumn({ type: 'datetime2', name: 'CreatedAt' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'datetime2', name: 'UpdatedAt' })
    updatedAt!: Date;
}
