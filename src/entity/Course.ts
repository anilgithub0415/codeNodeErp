// src/entity/Course.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany, CreateDateColumn, UpdateDateColumn, Unique } from 'typeorm';
import { Tenant } from './Tenant'; // Import Tenant entity
import { Subject } from './Subject'; // Assuming Subject entity exists
import { ProgramCourses } from './ProgramCourses'; // Assuming ProgramCourses exists
import { CourseOffering } from './CourseOffering'; // Import CourseOffering

@Unique(['tenantId', 'courseCode'])

@Entity({ name: 'Course' })
export class Course {
    @PrimaryGeneratedColumn()
    id!: number;

    // --- NEW: Tenant ID for multi-tenancy ---
    @Column({ type: 'nvarchar', length: 255, nullable: false, name: 'TenantId' })
    tenantId!: string;

    @ManyToOne(() => Tenant, tenant => tenant.courses)
    @JoinColumn({ name: 'TenantId' })
    tenant!: Tenant;
    // --- END NEW ---

    @Column({ type: 'nvarchar', length: 50,  nullable: false }) // Unique per tenant
    courseCode!: string;

    @Column({ type: 'nvarchar', length: 255, nullable: false })
    courseName!: string;

    @Column({ type: 'nvarchar', length: 'MAX', nullable: true })
    description?: string | null;

    @Column({ type: 'int', nullable: true })
    credits?: number | null;

    @Column({ type: 'int', nullable: false, name: 'SubjectId' })
    subjectId!: number;

    @ManyToOne(() => Subject, subject => subject.courses)
    @JoinColumn({ name: 'SubjectId' })
    subject!: Subject;

    @Column({ type: 'bit', default: true })
    isActive!: boolean;

    // Many-to-Many relationship with Program via ProgramCourses junction table
    @OneToMany(() => ProgramCourses, programCourse => programCourse.course)
    programCourses?: ProgramCourses[];

    // --- NEW: One-to-Many relationship with CourseOffering ---
    @OneToMany(() => CourseOffering, courseOffering => courseOffering.course)
    courseOfferings?: CourseOffering[];
    // --- END NEW ---

    @Column({ type: 'int', nullable: true, name: 'CreatedByUserId' })
    createdByUserId?: number | null;

    @CreateDateColumn({ type: 'datetime2', name: 'CreatedAt' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'datetime2', name: 'UpdatedAt' })
    updatedAt!: Date;
}