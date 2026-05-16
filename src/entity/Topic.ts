import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany, CreateDateColumn, UpdateDateColumn, Unique } from 'typeorm';
import { Tenant } from './Tenant'; // Import Tenant entity



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


    @Column({ type: 'bit', default: true })
    isActive!: boolean;


    @CreateDateColumn({ type: 'datetime2', name: 'CreatedAt' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'datetime2', name: 'UpdatedAt' })
    updatedAt!: Date;
}