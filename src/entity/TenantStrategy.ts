



// src/entity/TenantStrategy.ts
import { Entity, PrimaryColumn, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Unique, Check } from 'typeorm';
import { Tenant } from './Tenant';

export enum TenantStrategyNames {
  
  RoundOff_Strategy = 'RoundOff_Strategy',
  Pricing_Strategy='Pricing_Strategy'
  
}

@Check(`tenant_strategy_name IN (null,'RoundOff_Strategy', 'Pricing_Strategy')`)

// This class defines the structure of your 'TenantStrategy' table in the database.
@Entity({ name: 'TenantStrategy' }) 
@Unique(['tenantStrategyName'])
export class TenantStrategy {
  
    @PrimaryGeneratedColumn()
    id!: number;
 
      @Column({type:'int'})
    tenantId!:number;
    
     @ManyToOne(() => Tenant, (tenant) => tenant.tenantstrategies, { onDelete: 'NO ACTION' })
     @JoinColumn({ name: "tenantId" }) // Maps the relation to the column above
     tenant!: Tenant;


     @Column({ 
            name: 'tenant_strategy_name',
             type: "varchar", 
             length: 50, nullable:true
             
         })
         tenantStrategyName!: string;

    @Column({  name: 'tenant_strategy', type: 'nvarchar', length: 50 })
    tenantStrategy!: string;    

   
    @Column({ nullable:true})
    createdByUserId!:number;
    
}

