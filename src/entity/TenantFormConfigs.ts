// src/entity/TenntFormConfigs.ts - MODIFIED
import { Entity, PrimaryColumn, Column, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity({ name: 'TenantFormConfigs' })
@Unique(['tenantId', 'FormKey']) // Defines the composite unique constraint
export class TenantFormConfigs { 

    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'int' })
    tenantId!: number;

    // Removed unique: true so FormKey can repeat across different tenants
    @PrimaryColumn({ type: 'nvarchar', length: 50 })
    FormKey!: string;

    @Column({ type: 'nvarchar', length: "MAX" }) 
    FormlyConfig!: string; 
}
