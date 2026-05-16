import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany, CreateDateColumn, UpdateDateColumn, Unique } from 'typeorm';
import { Tenant } from './Tenant'; // Import Tenant entity
import { Subject } from './Subject'; // Import Subject entity
import { Question } from './Question'; // Import Question entity

// A topic name should be unique within a subject within a tenant
@Unique("UQ_TopicName_Subject_Tenant", ["topicName", "subjectId", "tenantId"])
@Entity({ name: 'Topic' })
export class Topic {
    @PrimaryGeneratedColumn()
    id!: number;

    // --- Tenant ID for multi-tenancy ---
    @Column({ type: 'nvarchar', length: 255, nullable: false, name: 'TenantId' })
    tenantId!: string;

    @ManyToOne(() => Tenant, tenant => tenant.topics) // Assuming Tenant has an inverse 'topics' property
    @JoinColumn({ name: 'TenantId' })
    tenant!: Tenant;
    // --- End Tenant ID ---

    @Column({ type: 'nvarchar', length: 255, nullable: false })
    topicName!: string;

    @Column({ type: 'nvarchar', length: 'MAX', nullable: true })
    description?: string | null;

    // Many-to-One relationship with Subject (a topic belongs to a specific subject)
    @Column({ type: 'int', nullable: false, name: 'SubjectId' })
    subjectId!: number;

    @ManyToOne(() => Subject, subject => subject.topics, { onDelete: 'CASCADE' }) // If subject is deleted, its topics are deleted
    @JoinColumn({ name: 'SubjectId' })
    subject!: Subject;

    @Column({ type: 'bit', default: true })
    isActive!: boolean;

    // One-to-Many relationship with Question (a topic can have many questions)
    @OneToMany(() => Question, question => question.topic)
    questions?: Question[];

    @CreateDateColumn({ type: 'datetime2', name: 'CreatedAt' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'datetime2', name: 'UpdatedAt' })
    updatedAt!: Date;
}