// src/entity/Program.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany, CreateDateColumn, UpdateDateColumn, Unique } from 'typeorm';
import { Tenant } from './Tenant'; // Import Tenant entity
import { ProgramCourses } from './ProgramCourses'; // Assuming ProgramCourses exists
import { Enrollment } from './Enrollment'; // Assuming Enrollment exists
import { StudentProfile } from './StudentProfile';
import { FacultyProfile } from './FacultyProfile';

@Unique(['tenantId', 'programCode'])
@Entity({ name: 'Program' })
export class Program {
    @PrimaryGeneratedColumn()
    id!: number;

    // --- NEW: Tenant ID for multi-tenancy ---
    @Column({ type: 'nvarchar', length: 255, nullable: false, name: 'TenantId' })
    tenantId!: string;

    @ManyToOne(() => Tenant, tenant => tenant.programs) // Assuming Tenant has an inverse 'programs' property
    @JoinColumn({ name: 'TenantId' })
    tenant!: Tenant;
    // --- END NEW ---

    @Column({ type: 'nvarchar', length: 255, nullable: false })
    programName!: string;

    @Column({ type: 'nvarchar', length: 50,  nullable: false })
    programCode!: string;

    @Column({ type: 'nvarchar', length: 'MAX', nullable: true })
    description?: string | null;

    @Column({ type: 'int', nullable: true })
    durationMonths?: number | null;

    @Column({ type: 'nvarchar', length: 50, nullable: true })
    targetExam?: string | null; // e.g., JEE, NEET

    @Column({ type: 'bit', default: true })
    isActive!: boolean;

    // Many-to-Many relationship with Course via ProgramCourses junction table
    @OneToMany(() => ProgramCourses, programCourse => programCourse.program)
    programCourses?: ProgramCourses[];

    // One-to-Many relationship with Enrollment (a program can have many enrollments)
    @OneToMany(() => Enrollment, enrollment => enrollment.program)
    enrollments?: Enrollment[];

    @OneToMany(() => StudentProfile, studentProfile => studentProfile.tenant)
    studentProfiles?: StudentProfile[];

    @OneToMany(() => FacultyProfile, facultyProfile => facultyProfile.tenant)
    facultyProfiles?: FacultyProfile[];

    @CreateDateColumn({ type: 'datetime2', name: 'CreatedAt' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'datetime2', name: 'UpdatedAt' })
    updatedAt!: Date;
}