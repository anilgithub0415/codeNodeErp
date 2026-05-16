import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Unique } from 'typeorm';
import { StudentProfile } from './StudentProfile'; // Import StudentProfile
import { Program } from './Program'; // Import Program
import { Tenant } from './Tenant'; // Import Tenant

@Unique("UQ_StudentProgramEnrollment_Tenant", ["studentProfileId", "programId", "tenantId"]) // Ensure unique enrollment per student per program per tenant
@Entity({ name: 'Enrollment' })
export class Enrollment {
    @PrimaryGeneratedColumn()
    id!: number;

    // --- NEW: Tenant ID for multi-tenancy ---
    @Column({ type: 'nvarchar', length: 255, nullable: false, name: 'TenantId' })
    tenantId!: string;

    @ManyToOne(() => Tenant, tenant => tenant.enrollments)
    @JoinColumn({ name: 'TenantId' })
    tenant!: Tenant;
    // --- END NEW ---

    // Many-to-One relationship with StudentProfile
    @Column({ type: 'int', nullable: false, name: 'StudentProfileId' })
    studentProfileId!: number;

    @ManyToOne(() => StudentProfile, studentProfile => studentProfile.enrollments, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'StudentProfileId' })
    studentProfile!: StudentProfile;

    // Many-to-One relationship with Program
    @Column({ type: 'int', nullable: false, name: 'ProgramId' })
    programId!: number;

    @ManyToOne(() => Program, program => program.enrollments, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'ProgramId' })
    program!: Program;

    @Column({ type: 'date', nullable: false })
    enrollmentDate!: Date;

    @Column({ type: 'nvarchar', length: 50, nullable: false })
    status!: string; // e.g., 'Active', 'Completed', 'Withdrawn', 'Suspended'

    @Column({ type: 'date', nullable: true })
    completionDate?: Date | null;

    @Column({ type: 'int', nullable: true, name: 'CreatedByUserId' })
    createdByUserId?: number | null;

    @CreateDateColumn({ type: 'datetime2', name: 'CreatedAt' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'datetime2', name: 'UpdatedAt' })
    updatedAt!: Date;
}