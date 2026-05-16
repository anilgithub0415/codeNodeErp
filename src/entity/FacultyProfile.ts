import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Person } from './Person';
import { Tenant } from './Tenant'; // Import Tenant


@Entity({ name: 'FacultyProfile' })
export class FacultyProfile {
    @PrimaryGeneratedColumn()
    id!: number;

    // --- Tenant ID for multi-tenancy ---
    @Column({ type: 'nvarchar', length: 255, nullable: false, name: 'TenantId' })
    tenantId!: string;

    @ManyToOne(() => Tenant, tenant => tenant.facultyProfiles)
    @JoinColumn({ name: 'TenantId' })
    tenant!: Tenant;
    // --- End Tenant ID ---

    // One-to-One relationship with Person
    @Column({ type: 'int', unique: true, nullable: false, name: 'PersonId' })
    personId!: number;

    @OneToOne(() => Person, person => person.facultyProfile, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'PersonId' })
    person!: Person;

    @Column({ type: 'nvarchar', length: 50, nullable: true })
    employeeIdNumber?: string | null; // e.g., unique ID assigned by the institute

    @Column({ type: 'nvarchar', length: 100, nullable: true })
    department?: string | null;

    @Column({ type: 'nvarchar', length: 100, nullable: true })
    designation?: string | null; // e.g., 'Professor', 'Lecturer'

    @Column({ type: 'bit', default: true })
    isActive!: boolean;


    @Column({ type: 'int', nullable: true, name: 'CreatedByUserId' })
    createdByUserId?: number | null;

    @CreateDateColumn({ type: 'datetime2', name: 'CreatedAt' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'datetime2', name: 'UpdatedAt' })
    updatedAt!: Date;
}
