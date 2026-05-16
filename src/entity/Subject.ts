import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany, CreateDateColumn, UpdateDateColumn, Unique } from 'typeorm';
import { Tenant } from './Tenant';
import { Course } from './Course';
import { Topic } from './Topic';
// import { Question } from './Question'; // No longer directly linked here, as Questions link via Topic

@Unique(['tenantId', 'subjectCode'])

@Entity({ name: 'Subject' })
export class Subject {
    @PrimaryGeneratedColumn()
    id!: number; 

    @Column({ type: 'nvarchar', length: 255, nullable: false, name: 'TenantId' })
    tenantId!: string;

    @ManyToOne(() => Tenant, tenant => tenant.subjects)
    @JoinColumn({ name: 'TenantId' })
    tenant!: Tenant;

    @Column({ type: 'nvarchar', length: 100, nullable: false })
    subjectName!: string;

    @Column({ type: 'nvarchar', length: 20,  nullable: false }) // Unique per tenant
    subjectCode!: string;

    @Column({ type: 'bit', default: true })
    isActive!: boolean;

    @OneToMany(() => Course, course => course.subject)
    courses?: Course[];
    
    // --- MODIFIED: Removed direct OneToMany to Question ---
    // Questions now link to Topic, and Topic links to Subject.
    // @OneToMany(() => Question, question => question.subject)
    // questions?: Question[]; // REMOVED

    @OneToMany(() => Topic, topic => topic.subject)
    topics?: Topic[];

    @Column({ type: 'int', nullable: true, name: 'CreatedByUserId' })
    createdByUserId?: number | null;


    @CreateDateColumn({ type: 'datetime2', name: 'CreatedAt' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'datetime2', name: 'UpdatedAt' })
    updatedAt!: Date;
}