// src/entity/TenntFormConfigs.ts - MODIFIED
import { Entity, PrimaryColumn, Column, PrimaryGeneratedColumn  } from 'typeorm';



@Entity({ name: 'TenantFormConfigs' })
export class TenantFormConfigs { 

        @PrimaryGeneratedColumn()
        id!: number;
   @Column({type:'int'})
    tenantId!:number;

    @PrimaryColumn({ type: 'nvarchar', length: 50, unique: true })
    FormKey!: string;

    
    @Column({ type: 'nvarchar', length: "MAX",  }) 
    FormlyConfig!: string; 

    
   
}