// src/entity/SubscriptionPlanLookup.ts
import { Entity, PrimaryColumn, OneToMany, Column } from 'typeorm';
import { Tenant } from './Tenant'; // Import Tenant entity for the relation

@Entity({ name: 'SubscriptionPlans' }) // Matches your SQL table name
export class SubscriptionPlanLookup {
    // Using PlanName as the primary key as per your SQL schema
    @PrimaryColumn({ type: 'nvarchar', length: 50, name: 'PlanName' })
    planName!: string;

    // Optional: You could add more details about the plan here
    // @Column({ type: 'nvarchar', length: 255, nullable: true })
    // description?: string;

    // @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    // price?: number;

    // One-to-Many relationship with Tenant entity
    @OneToMany(() => Tenant, tenant => tenant.subscriptionPlan)
    tenants?: Tenant[]; // This will be the inverse side of the ManyToOne relationship in Tenant
}