import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Unique } from 'typeorm';
import { Program } from './Program';
import { Course } from './Course';
import { Tenant } from './Tenant'; // Import Tenant entity

@Unique("UQ_ProgramCourse_Tenant", ["programId", "courseId", "tenantId"]) // Ensure unique combination within a tenant
@Entity({ name: 'ProgramCourses' })
export class ProgramCourses {
    @PrimaryGeneratedColumn()
    id!: number;

    // --- NEW: Tenant ID for multi-tenancy ---
    @Column({ type: 'nvarchar', length: 255, nullable: false, name: 'TenantId' })
    tenantId!: string;

    @ManyToOne(() => Tenant, tenant => tenant.programs)
    @JoinColumn({ name: 'TenantId' })
    tenant!: Tenant;
    // --- END NEW ---

    @Column({ type: 'int', nullable: false, name: 'ProgramId' })
    programId!: number;

    @ManyToOne(() => Program, program => program.programCourses, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'ProgramId' })
    program!: Program;

    @Column({ type: 'int', nullable: false, name: 'CourseId' })
    courseId!: number;

    @ManyToOne(() => Course, course => course.programCourses, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'CourseId' })
    course!: Course;

    @Column({ type: 'int', nullable: true })
    orderInProgram?: number | null; // e.g., for sequential courses

    @CreateDateColumn({ type: 'datetime2', name: 'CreatedAt' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'datetime2', name: 'UpdatedAt' })
    updatedAt!: Date;
}