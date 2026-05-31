// src/entity/TenntFormConfigs.ts - MODIFIED
import { Entity, PrimaryColumn, Column  } from 'typeorm';



@Entity({ name: 'TenantFormConfigs' })
export class TenantFormConfigs { 
    @PrimaryColumn({ type: 'nvarchar', length: 255, name: 'tenantId' })
    tenantId!: string;

    @PrimaryColumn({ type: 'nvarchar', length: 50, unique: true })
    FormKey!: string;

    
    @Column({ type: 'nvarchar', length: "MAX",  }) 
    FormlyConfig!: string; 

    
   
}