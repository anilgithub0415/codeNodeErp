import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany, CreateDateColumn, UpdateDateColumn, Unique } from 'typeorm';
import { Tenant } from './Tenant';

import { User } from './User';


@Unique("UQ_TenantQuestion_MasterQuestion", ["tenantId", "masterQuestionId"])
@Entity({ name: 'TenantQuestion' })
export class TenantQuestion {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'nvarchar', length: 255, nullable: false, name: 'TenantId' })
    tenantId!: string;

    @ManyToOne(() => Tenant, tenant => tenant.tenantQuestions, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'TenantId' })
    tenant!: Tenant;

    @Column({ type: 'int', nullable: true, name: 'MasterQuestionId' })
    masterQuestionId?: number | null;

    // @ManyToOne(() => Question, question => question.tenantQuestions, { onDelete: 'SET NULL' })
    // @JoinColumn({ name: 'MasterQuestionId' })

    @Column({ type: 'nvarchar', length: 'MAX', nullable: true })
    questionText?: string | null;

    @Column({ type: 'nvarchar', length: 500, nullable: true })
    questionImageUrl?: string | null;

    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    customMarks?: number | null;

    @Column({ type: 'int', nullable: true })
    customDifficultyLevel?: number | null;

    @Column({ type: 'nvarchar', length: 'MAX', nullable: true })
    solutionText?: string | null;

    @Column({ type: 'nvarchar', length: 500, nullable: true })
    solutionImageUrl?: string | null;

    @Column({ type: 'bit', default: true })
    isActiveInTenant!: boolean;

    // --- NEW: One-to-Many relationship with AssignmentQuestion ---
    // A tenant question can be part of many assignment questions
    // @OneToMany(() => AssignmentQuestion, assignmentQuestion => assignmentQuestion.tenantQuestion)
    // assignmentQuestions?: AssignmentQuestion[];
    // --- END NEW ---

    @CreateDateColumn({ type: 'datetime2', name: 'CreatedAt' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'datetime2', name: 'UpdatedAt' })
    updatedAt!: Date;

    @Column({ type: 'int', nullable: true, name: 'CreatedByUserId' })
    createdByUserId?: number | null;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'CreatedByUserId' })
    createdBy?: User | null;
}