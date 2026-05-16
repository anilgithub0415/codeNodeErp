import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn, Unique } from 'typeorm';
import { Person } from './Person';
import { Tenant } from './Tenant'; // Import Tenant
import { Enrollment } from './Enrollment'; // Import Enrollment
import { AssignmentAttempt } from './AssignmentAttempt';
import { StudentCourseOffering } from './StudentCourseOffering';


@Unique(['tenantId', 'personId'])
@Entity({ name: 'StudentProfile' })
export class StudentProfile {
    @PrimaryGeneratedColumn()
    id!: number;

    // --- Tenant ID for multi-tenancy ---
    @Column({ type: 'nvarchar', length: 255, nullable: false, name: 'TenantId' })
    tenantId!: string;

    @ManyToOne(() => Tenant, tenant => tenant.studentProfiles)
    @JoinColumn({ name: 'TenantId' })
    tenant!: Tenant;
    // --- End Tenant ID ---

    // One-to-One relationship with Person
    @Column({ type: 'int',  nullable: false, name: 'PersonId' })
    personId!: number;

    @OneToOne(() => Person, person => person.studentProfile, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'PersonId' })
    person!: Person;

    @Column({ type: 'nvarchar', length: 50, nullable: true })
    studentIdNumber?: string | null; // e.g., unique ID assigned by the institute

    @Column({ type: 'nvarchar', length: 50, nullable: true })
    enrollmentStatus?: string | null; // e.g., 'Prospective', 'Enrolled', 'Graduated', 'Withdrawn'

    @Column({ type: 'date', nullable: true })
    enrollmentDate?: Date | null;

    // One-to-Many relationship with Enrollment (a student profile can have many enrollments in different programs)
    @OneToMany(() => Enrollment, enrollment => enrollment.studentProfile)
    enrollments?: Enrollment[];

    @OneToMany(() => AssignmentAttempt, attempt => attempt.studentProfile)
    assignmentAttempts?: AssignmentAttempt[];

    @OneToMany(() => StudentCourseOffering, sco => sco.studentProfile)
    studentCourseOfferings?: StudentCourseOffering[];
   
    
    @Column({ type: 'int', nullable: true, name: 'CreatedByUserId' })
    createdByUserId?: number | null;
    
    @CreateDateColumn({ type: 'datetime2', name: 'CreatedAt' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'datetime2', name: 'UpdatedAt' })
    updatedAt!: Date;
}
