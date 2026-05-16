import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { User } from './User'; // Import the global User entity
import { StudentProfile } from './StudentProfile'; // StudentProfile still links to Person
import { FacultyProfile } from './FacultyProfile';

@Entity({ name: 'Person' })
export class Person {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'nvarchar', length: 100, nullable: false })
    firstName!: string;

    @Column({ type: 'nvarchar', length: 100, nullable: true })
    lastName?: string | null;

    @Column({ type: 'nvarchar', length: 255, unique: true, nullable: false }) // Primary contact email for the person (global uniqueness)
    contactEmail!: string;

    @Column({ type: 'nvarchar', length: 20, nullable: true })
    contactPhone?: string | null;

    @Column({ type: 'date', nullable: true })
    dateOfBirth?: Date | null;

    @Column({ type: 'nvarchar', length: 10, nullable: true }) // e.g., 'Male', 'Female', 'Other'
    gender?: string | null;

    @Column({ type: 'nvarchar', length: 255, nullable: true })
    addressLine1?: string | null;

    @Column({ type: 'nvarchar', length: 255, nullable: true })
    addressLine2?: string | null;

    @Column({ type: 'nvarchar', length: 100, nullable: true })
    city?: string | null;

    @Column({ type: 'nvarchar', length: 100, nullable: true })
    state?: string | null;

    @Column({ type: 'nvarchar', length: 20, nullable: true })
    zipCode?: string | null;

    @Column({ type: 'nvarchar', length: 100, nullable: true })
    country?: string | null;

    // --- One-to-One relationship with User (one Person has one global User login account) ---
    // The foreign key (personId) will be on the User entity.
    //  @OneToOne(() => User, user => user.person)
    //  user?: User | null; // This property holds the User object
    // --- END One-to-One ---

    // One-to-One relationship with StudentProfile (one Person can have one StudentProfile)
    // StudentProfile describes the academic aspects of a Person, not necessarily tied to a specific login session.
    @OneToOne(() => StudentProfile, studentProfile => studentProfile.person)
    studentProfile?: StudentProfile | null;

      // One-to-One relationship with FacultyProfile
    @OneToOne(() => FacultyProfile, facultyProfile => facultyProfile.person)
    facultyProfile?: FacultyProfile | null;

    
    @Column({ type: 'int', nullable: true, name: 'CreatedByUserId' })
    createdByUserId?: number | null;

    
    @ManyToOne(() => User, user => user.createdUsers, { nullable: true, onDelete: 'NO ACTION' })
    @JoinColumn({ name: 'CreatedByUserId' })
    createdBy?: User | null;

    // Audit fields
    @CreateDateColumn({ type: 'datetime2', name: 'CreatedAt' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'datetime2', name: 'UpdatedAt' })
    updatedAt!: Date;
}