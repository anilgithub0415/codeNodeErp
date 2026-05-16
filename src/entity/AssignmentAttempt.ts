import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Unique, OneToMany } from 'typeorm';
import { Assignment } from './Assignment'; // Import Assignment entity
import { StudentProfile } from './StudentProfile'; // Import StudentProfile entity
import { Tenant } from './Tenant'; // Import Tenant entity
import { StudentQuestionAnswer } from './StudentQuestionAnswer';

// A student can have only one attempt per assignment (or if multiple, they'd be versioned or have a sequence)
// For simplicity, assuming one active attempt per student per assignment.
@Unique("UQ_StudentAssignmentAttempt_Tenant", ["studentProfileId", "assignmentId", "tenantId"])
@Entity({ name: 'AssignmentAttempt' })
export class AssignmentAttempt {
    @PrimaryGeneratedColumn()
    id!: number;

    // --- Tenant ID for multi-tenancy ---
    @Column({ type: 'nvarchar', length: 255, nullable: false, name: 'TenantId' })
    tenantId!: string;

    @ManyToOne(() => Tenant, tenant => tenant.assignmentAttempts) // Assuming Tenant has an inverse 'assignmentAttempts' property
    @JoinColumn({ name: 'TenantId' })
    tenant!: Tenant;
    // --- End Tenant ID ---

    // Many-to-One relationship with StudentProfile
    @Column({ type: 'int', nullable: false, name: 'StudentProfileId' })
    studentProfileId!: number;

    @ManyToOne(() => StudentProfile, studentProfile => studentProfile.assignmentAttempts, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'StudentProfileId' })
    studentProfile!: StudentProfile;

    // Many-to-One relationship with Assignment
    @Column({ type: 'int', nullable: false, name: 'AssignmentId' })
    assignmentId!: number;

    @ManyToOne(() => Assignment, assignment => assignment.assignmentAttempts, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'AssignmentId' })
    assignment!: Assignment;

    @Column({ type: 'datetime2', nullable: false })
    submissionDate!: Date;

    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true }) // e.g., 85.50
    score?: number | null;

    @Column({ type: 'nvarchar', length: 50, nullable: true })
    status?: string | null; // e.g., 'Submitted', 'Graded', 'Late', 'Resubmitted'

    @Column({ type: 'nvarchar', length: 'MAX', nullable: true })
    feedback?: string | null;

    @Column({ type: 'nvarchar', length: 'MAX', nullable: true })
    submissionContentUrl?: string | null; // URL to a file submission, if applicable

    @OneToMany(() => StudentQuestionAnswer, sqa => sqa.assignmentAttempt)
    studentQuestionAnswers?: StudentQuestionAnswer[];
    
    @CreateDateColumn({ type: 'datetime2', name: 'CreatedAt' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'datetime2', name: 'UpdatedAt' })
    updatedAt!: Date;
}