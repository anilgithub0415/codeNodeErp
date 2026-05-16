//info: What CourseOffering doesn't tell you: Which specific students are in 'Physics 11 Batch A'. So StudentCourseOffering is added
//StudentCourseOffering tells you : "Student X is attending 'Physics 11 Batch A'."
//why its needed
// Granular Tracking: A student might be enrolled in a program, but attend different batches for different courses within that program (e.g., Physics in Batch A, Chemistry in Batch B).

// Attendance & Grades per Batch: This record is essential for tracking attendance, grades, and progress specific to a student's participation in a particular class.

// Capacity Management: When a student is assigned to a CourseOffering, you would increment CourseOffering.enrolledStudentsCount.

// Flexibility: If a student drops a specific course offering or switches batches, you update this record, not their overall program enrollment.

// Faculty View: A faculty member needs to see which students are in their specific CourseOffering.


import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Unique } from 'typeorm';
import { StudentProfile } from './StudentProfile'; // Import StudentProfile entity

import { Tenant } from './Tenant'; // Import Tenant entity

// A student can be assigned to a specific course offering only once within a tenant
@Unique("UQ_StudentCourseOffering_Tenant", ["studentProfileId", "courseOfferingId", "tenantId"])
@Entity({ name: 'StudentCourseOffering' })
export class StudentCourseOffering {
    @PrimaryGeneratedColumn()
    id!: number;

    // --- Tenant ID for multi-tenancy ---
    // This record belongs to the same tenant as its StudentProfile and CourseOffering.
    @Column({ type: 'nvarchar', length: 255, nullable: false, name: 'TenantId' })
    tenantId!: string;

    @ManyToOne(() => Tenant, tenant => tenant.studentCourseOfferings) // Assuming Tenant has an inverse 'studentCourseOfferings' property
    @JoinColumn({ name: 'TenantId' })
    tenant!: Tenant;
    // --- End Tenant ID ---

    // Many-to-One relationship with StudentProfile
    @Column({ type: 'int', nullable: false, name: 'StudentProfileId' })
    studentProfileId!: number;

    @ManyToOne(() => StudentProfile, studentProfile => studentProfile.studentCourseOfferings, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'StudentProfileId' })
    studentProfile!: StudentProfile;



    @Column({ type: 'date', nullable: false })
    assignmentDate!: Date; // Date when the student was assigned to this offering

    @Column({ type: 'nvarchar', length: 50, nullable: false })
    status!: string; // e.g., 'Active', 'Completed', 'Dropped', 'Transferred'

    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    finalGrade?: number | null; // Final grade for this specific course offering

    @CreateDateColumn({ type: 'datetime2', name: 'CreatedAt' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'datetime2', name: 'UpdatedAt' })
    updatedAt!: Date;
}