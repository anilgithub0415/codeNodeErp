import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Course } from './Course'; // Import Course entity
import { Tenant } from './Tenant'; // Import Tenant entity
import { FacultyProfile } from './FacultyProfile'; // Import FacultyProfile entity
import { Assignment } from './Assignment';
import { StudentCourseOffering } from './StudentCourseOffering';

@Entity({ name: 'CourseOffering' })
export class CourseOffering {
    @PrimaryGeneratedColumn()
    id!: number;

    // --- NEW: Tenant ID for multi-tenancy ---
    @Column({ type: 'nvarchar', length: 255, nullable: false, name: 'TenantId' })
    tenantId!: string;

    @ManyToOne(() => Tenant, tenant => tenant.courseOfferings)
    @JoinColumn({ name: 'TenantId' })
    tenant!: Tenant;
    // --- END NEW ---

    @Column({ type: 'int', nullable: false, name: 'CourseId' })
    courseId!: number;

    @ManyToOne(() => Course, course => course.courseOfferings)
    @JoinColumn({ name: 'CourseId' })
    course!: Course;

    // --- NEW: Faculty ID for the instructor ---
    @Column({ type: 'int', nullable: true, name: 'FacultyProfileId' }) // Nullable if instructor can be assigned later
    facultyProfileId?: number | null;

    @ManyToOne(() => FacultyProfile, faculty => faculty.courseOfferings)
    @JoinColumn({ name: 'FacultyProfileId' })
    faculty?: FacultyProfile | null;
    // --- END NEW ---

    @Column({ type: 'nvarchar', length: 255, nullable: false })
    offeringName!: string; // e.g., "Physics 11 Batch A - Mon/Wed"

    @Column({ type: 'datetime2', nullable: true })
    startDate?: Date | null;

    @Column({ type: 'datetime2', nullable: true })
    endDate?: Date | null;

    @Column({ type: 'nvarchar', length: 255, nullable: true })
    schedule?: string | null; // e.g., "Mon, Wed, Fri 10:00-12:00"

    @Column({ type: 'nvarchar', length: 100, nullable: true })
    location?: string | null; // e.g., "Room 11"

    @Column({ type: 'int', nullable: true })
    capacity?: number | null;

    @Column({ type: 'int', nullable: true })
    enrolledStudentsCount?: number | null; // Denormalized count, updated via triggers or service logic

    @Column({ type: 'bit', default: true })
    isActive!: boolean;

    @OneToMany(() => Assignment, assignment => assignment.courseOffering)
    assignments?: Assignment[];
    
    @OneToMany(() => StudentCourseOffering, sco => sco.courseOffering)
    studentCourseOfferings?: StudentCourseOffering[];

    @Column({ type: 'int', nullable: true, name: 'CreatedByUserId' })
    createdByUserId?: number | null;
    
    @CreateDateColumn({ type: 'datetime2', name: 'CreatedAt' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'datetime2', name: 'UpdatedAt' })
    updatedAt!: Date;
}