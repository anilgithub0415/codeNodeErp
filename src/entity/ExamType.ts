import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Tenant } from './Tenant'; // Import Tenant entity
import { QuestionExamTypes } from './QuestionExamTypes'; // NEW: Import QuestionExamTypes entity

@Entity({ name: 'ExamType' })
export class ExamType {
    @PrimaryGeneratedColumn()
    id!: number;

    // --- NEW: Tenant ID for multi-tenancy ---
    // Exam Types are typically tenant-specific.
    @Column({ type: 'nvarchar', length: 255, nullable: false, name: 'TenantId' })
    tenantId!: string;

    @ManyToOne(() => Tenant, tenant => tenant.examTypes) // Assuming Tenant has an inverse 'examTypes' property
    @JoinColumn({ name: 'TenantId' })
    tenant!: Tenant;
    // --- END NEW ---

    @Column({ type: 'nvarchar', length: 100, unique: true, nullable: false }) // Unique per tenant
    examTypeName!: string;

    @Column({ type: 'nvarchar', length: 255, nullable: true })
    description?: string | null;

    @Column({ type: 'bit', default: true })
    isActive!: boolean;

    // --- NEW: One-to-Many relationship with QuestionExamTypes (for M:M link) ---
    @OneToMany(() => QuestionExamTypes, qet => qet.examType)
    questionExamTypes?: QuestionExamTypes[];
    // --- END NEW ---

    @CreateDateColumn({ type: 'datetime2', name: 'CreatedAt' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'datetime2', name: 'UpdatedAt' })
    updatedAt!: Date;
}