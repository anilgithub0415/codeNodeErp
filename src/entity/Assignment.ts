import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { CourseOffering } from './CourseOffering'; // Import CourseOffering entity
import { Tenant } from './Tenant'; // Import Tenant entity
import { AssignmentAttempt } from './AssignmentAttempt'; // Import AssignmentAttempt entity
import { AssignmentQuestion } from './AssignmentQuestion';

@Entity({ name: 'Assignment' })
export class Assignment {
    @PrimaryGeneratedColumn()
    id!: number;

    // --- Tenant ID for multi-tenancy ---
    @Column({ type: 'nvarchar', length: 255, nullable: false, name: 'TenantId' })
    tenantId!: string;

    @ManyToOne(() => Tenant, tenant => tenant.assignments) // Assuming Tenant has an inverse 'assignments' property
    @JoinColumn({ name: 'TenantId' })
    tenant!: Tenant;
    // --- End Tenant ID ---

    // Many-to-One relationship with CourseOffering (an assignment belongs to a specific course offering)
    @Column({ type: 'int', nullable: false, name: 'CourseOfferingId' })
    courseOfferingId!: number;

    @ManyToOne(() => CourseOffering, courseOffering => courseOffering.assignments, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'CourseOfferingId' })
    courseOffering!: CourseOffering;

    @Column({ type: 'nvarchar', length: 255, nullable: false })
    assignmentName!: string;

    @Column({ type: 'nvarchar', length: 'MAX', nullable: true })
    description?: string | null;

    @Column({ type: 'datetime2', nullable: true })
    dueDate?: Date | null;

    @Column({ type: 'datetime2', nullable: true })
    visibilityDate?: Date | null;

    @Column({ type: 'int', nullable: true })
    maxScore?: number | null;

    @Column({ type: 'nvarchar', length: 50, nullable: true })
    assignmentPurpose?: string | null; // e.g., 'Quiz', 'Homework', 'Exam', 'Project'

    
    // --- New fields for Quiz timing configurations ---
    @Column({ type: 'int', nullable: true })
    quizTimeLimitSeconds?: number | null; // Total time limit for the entire quiz

    @Column({ type: 'int', nullable: true })
    questionTimeLimitSeconds?: number | null; // Time limit per question
    // --- End of new fields ---

    @Column({ type: 'bit', default: true })
    isActive!: boolean;

    
   

    // One-to-Many relationship with AssignmentAttempt (an assignment can have many attempts by different students)
    @OneToMany(() => AssignmentAttempt, attempt => attempt.assignment)
    assignmentAttempts?: AssignmentAttempt[];

    @OneToMany(() => AssignmentQuestion, question => question.assignment)
    assignmentQuestions?: AssignmentQuestion[];
  
    @Column({ type: 'int', nullable: true, name: 'CreatedByUserId' })
    createdByUserId?: number | null;
    
    @CreateDateColumn({ type: 'datetime2', name: 'CreatedAt' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'datetime2', name: 'UpdatedAt' })
    updatedAt!: Date;
}