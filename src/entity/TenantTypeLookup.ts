// src/entity/TenantTypeLookup.ts
import { Entity, PrimaryColumn, OneToMany, Column } from 'typeorm';
import { Tenant } from './Tenant'; // Import Tenant entity for the relation

@Entity({ name: 'TenantTypes' }) // Matches your SQL table name
export class TenantTypeLookup {
    // Using TypeName as the primary key as per your SQL schema
    @PrimaryColumn({ type: 'nvarchar', length: 50, name: 'TypeName' })
    typeName!: string;

    // Optional: You could add a description column here if needed
    // @Column({ type: 'nvarchar', length: 255, nullable: true })
    // description?: string;

    // One-to-Many relationship with Tenant entity
    @OneToMany(() => Tenant, tenant => tenant.tenantType)
    tenants?: Tenant[]; // This will be the inverse side of the ManyToOne relationship in Tenant
}