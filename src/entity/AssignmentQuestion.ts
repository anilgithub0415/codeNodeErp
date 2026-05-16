import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Unique } from 'typeorm';
import { Assignment } from './Assignment'; // Import Assignment entity
import { Question } from './Question'; // NEW: Import Question entity
import { Tenant } from './Tenant'; // Import Tenant entity

// An assignment can include a specific question only once
@Unique("UQ_AssignmentQuestion_Tenant", ["assignmentId", "questionId", "tenantId"])
@Entity({ name: 'AssignmentQuestion' })
export class AssignmentQuestion {
    @PrimaryGeneratedColumn()
    id!: number;

    // --- Tenant ID for multi-tenancy ---
    // This record belongs to the same tenant as its Assignment and Question.
    @Column({ type: 'nvarchar', length: 255, nullable: false, name: 'TenantId' })
    tenantId!: string;

    @ManyToOne(() => Tenant, tenant => tenant.assignmentQuestions)
    @JoinColumn({ name: 'TenantId' }) 
    tenant!: Tenant;
    // --- End Tenant ID ---

    // Many-to-One relationship with Assignment
    @Column({ type: 'int', nullable: false, name: 'AssignmentId' })
    assignmentId!: number;

    @ManyToOne(() => Assignment, assignment => assignment.assignmentQuestions, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'AssignmentId' })
    assignment!: Assignment;

    // --- NEW: Many-to-One relationship with Question (from the question bank) ---
    @Column({ type: 'int', nullable: false, name: 'QuestionId' })
    questionId!: number;

    @ManyToOne(() => Question, question => question.assignmentQuestions, { onDelete: 'CASCADE' }) //earlier was RESTRICT// Prevent deleting a question if it's used in an assignment
    @JoinColumn({ name: 'QuestionId' })
    question!: Question; // This is the property that holds the Question entity
    // --- END NEW ---

    @Column({ type: 'int', nullable: true })
    points?: number | null; // Points for this question in THIS assignment (can override default from Question)

    @Column({ type: 'int', nullable: true })
    orderInAssignment?: number | null; // Order of the question within the assignment

    @CreateDateColumn({ type: 'datetime2', name: 'CreatedAt' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'datetime2',  name: 'UpdatedAt' })
    updatedAt!: Date;
}