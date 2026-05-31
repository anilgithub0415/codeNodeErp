



// src/entity/TenantStrategy.ts
import { Entity, PrimaryColumn, Column, PrimaryGeneratedColumn } from 'typeorm';

// This class defines the structure of your 'TenantStrategy' table in the database.
@Entity({ name: 'TenantStrategy' }) 
export class TenantStrategy {

    @PrimaryGeneratedColumn()
    id!: number;
 
    @Column({name:"tenant_id",type:'nvarchar'})
    tenantId!:string;
      
    @Column({  name: 'tenant_strategy_name', type: 'nvarchar', length: 50 })
    tenantStrategyName!: string; 

    @Column({  name: 'tenant_strategy', type: 'nvarchar', length: 50 })
    tenantStrategy!: string;    

   
    @Column({ nullable:true})
    createdByUserId!:number;
    
}

