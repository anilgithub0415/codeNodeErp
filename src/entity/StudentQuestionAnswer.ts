import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Unique } from 'typeorm';

import { Tenant } from './Tenant'; // Import Tenant entity

// A student can have only one answer for a specific question within a specific assignment attempt within a tenant
@Unique("UQ_StudentQuestionAnswer_Tenant", ["assignmentAttemptId", "questionId", "tenantId"])
@Entity({ name: 'StudentQuestionAnswer' })
export class StudentQuestionAnswer {
    @PrimaryGeneratedColumn()
    id!: number;

    // --- Tenant ID for multi-tenancy ---
    @Column({ type: 'nvarchar', length: 255, nullable: false, name: 'TenantId' })
    tenantId!: string;

    @ManyToOne(() => Tenant, tenant => tenant.studentQuestionAnswers)
    @JoinColumn({ name: 'TenantId' })
    tenant!: Tenant;
    // --- End Tenant ID ---



    @Column({ type: 'nvarchar', length: 'MAX', nullable: true })
    studentAnswerContent?:  string | string[]; // The student's answer (e.g., selected option, typed text)

    @Column({ type: 'bit', nullable: true })
    isCorrect?: boolean | null; // Whether the student's answer was correct

    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    scoreEarned?: number | null; // Score earned for this specific question

    @Column({ type: 'nvarchar', length: 'MAX', nullable: true })
    teacherFeedback?: string | null; // Feedback specific to this question's answer

    @CreateDateColumn({ type: 'datetime2', name: 'CreatedAt' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'datetime2', name: 'UpdatedAt' })
    updatedAt!: Date;
} 