



// src/entity/TenantStrategy.ts
import { Entity, PrimaryColumn, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Tenant } from './Tenant';

// This class defines the structure of your 'TenantStrategy' table in the database.
@Entity({ name: 'TenantStrategy' }) 
export class TenantStrategy {

    @PrimaryGeneratedColumn()
    id!: number;
 
      @Column({type:'int'})
    tenantId!:number;
    
     @ManyToOne(() => Tenant, (tenant) => tenant.tenantstrategies, { onDelete: 'NO ACTION' })
     @JoinColumn({ name: "tenantId" }) // Maps the relation to the column above
     tenant!: Tenant;


    @Column({  name: 'tenant_strategy_name', type: 'nvarchar', length: 50 })
    tenantStrategyName!: string; 

    @Column({  name: 'tenant_strategy', type: 'nvarchar', length: 50 })
    tenantStrategy!: string;    

   
    @Column({ nullable:true})
    createdByUserId!:number;
    
}

