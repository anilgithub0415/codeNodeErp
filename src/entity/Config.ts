// src/entity/Config.ts
import { Entity, PrimaryGeneratedColumn, Column, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { Tenant } from './Tenant';

@Entity({ name: 'Config' })
@Unique(['tenantId', 'appname']) // Guarantees a unique application configuration record per tenant
export class Config {

    @PrimaryGeneratedColumn()
    id!: number;
 
    @Column({ type: 'int' })
    tenantId!: number;

    @ManyToOne(() => Tenant, (tenant) => tenant.configs, { onDelete: 'NO ACTION' })
    @JoinColumn({ name: "tenantId" })
    tenant!: Tenant;

    @Column({ type: 'nvarchar', length: 50, name: 'appname' })
    appname!: string; // Distinguishes multiple configurations if needed per tenant

    // Decides whether user added thru superadmin or signup  
    @Column({ name: 'config_useraddthru', type: 'nvarchar', length: 20, nullable: true })
    config_useraddthru!: string;

    @Column({ name: 'config_productFlatOrVariant', type: 'nvarchar', length: 20, default: 'ProductFlat' })
    config_productFlatOrVariant!: string;

    // Note:Logic/protocol
    // if for Gharana 'Site_Supervisor' role is expected to allow  'behalf client side' then this config must have 'Site_Supervisor' role specified
    // if for Khurana 'Site_Manager' role is expected then he must be specified for tenant Khurana
    @Column({ 
        name: 'config_client_onbehalf_roles',  
        type: 'simple-array', // Fallback to 'simple-json' if storing complex objects, but simple-array is perfect for string lists
        nullable: true 
    })
    config_client_onbehalf_roles!: string[]; // Example value: ['Site_Supervisor', 'Client_Admin', 'Site_Manager']
}
