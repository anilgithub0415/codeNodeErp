




// import { Entity, PrimaryColumn, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Unique, Check } from 'typeorm';
// import { Tenant } from './Tenant';

// export enum TenantStrategyNames {
  
//   RoundOff_Strategy = 'RoundOff_Strategy',
//   Pricing_Strategy='Pricing_Strategy'
  
// }

// @Check(`tenant_strategy_name IN (null,'RoundOff_Strategy', 'Pricing_Strategy')`)

// @Entity({ name: 'TenantStrategy' }) 
// @Unique(['tenantStrategyName'])
// export class TenantStrategy {
  
//     @PrimaryGeneratedColumn()
//     id!: number;
 
//       @Column({type:'int'})
//     tenantId!:number;
    
//      @ManyToOne(() => Tenant, (tenant) => tenant.tenantstrategies, { onDelete: 'NO ACTION' })
//      @JoinColumn({ name: "tenantId" }) // Maps the relation to the column above
//      tenant!: Tenant;


//      @Column({ 
//             name: 'tenant_strategy_name',
//              type: "varchar", 
//              length: 50, nullable:true
             
//          })
//          tenantStrategyName!: string;

//     @Column({  name: 'tenant_strategy', type: 'nvarchar', length: 50 })
//     tenantStrategy!: string;    

   
//     @Column({ nullable:true})
//     createdByUserId!:number;
    
// }
 

// src/entity/TenantStrategy.ts
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Unique, Check } from 'typeorm';
import { Tenant } from './Tenant';
 
export enum TenantStrategyNames {   
  RoundOff_Strategy = 'RoundOff_Strategy',
  Pricing_Strategy = 'Pricing_Strategy'
}

// Allowed values when tenantStrategyName is 'RoundOff_Strategy'
export enum RoundOffStrategies {
  NONE = 'NONE',
  NEAREST_1 = 'NEAREST_1',
  NEAREST_0_50 = 'NEAREST_0_50',
  NEAREST_0_05 = 'NEAREST_0_05',
  UP = 'UP',
  DOWN = 'DOWN',
  CUSTOM_HOOK = 'CUSTOM_HOOK'
}

// Allowed values when tenantStrategyName is 'Pricing_Strategy'
export enum PricingStrategies {
  CATEGORY_BASED = 'CATEGORY_BASED',
  PLAIN = 'PLAIN'
}

// Conditional check constraint enforcing dependent enum values
@Check(`
  (tenant_strategy_name IS NULL) OR
  (tenant_strategy_name = 'RoundOff_Strategy' AND tenant_strategy IN ('NONE', 'NEAREST_1', 'NEAREST_0_50', 'NEAREST_0_05', 'UP', 'DOWN', 'CUSTOM_HOOK')) 
  OR
  (tenant_strategy_name = 'Pricing_Strategy' AND tenant_strategy IN ('CATEGORY_BASED', 'PLAIN')) 
  OR
  (tenant_strategy_name = 'Product_FlatOrVariant' AND tenant_strategy IN ('FLAT', 'VARIANT'))
    OR
  (tenant_strategy_name = 'Quotation_Workflow' AND tenant_strategy IN ('STANDARD_APPROVAL', 'NOSENDSTEP'))

`)
@Entity({ name: 'TenantStrategy' }) 
@Unique(['tenantStrategyName'])
export class TenantStrategy {
  
    @PrimaryGeneratedColumn()
    id!: number;
 
    @Column({ type: 'int' })
    tenantId!: number;
    
    @ManyToOne(() => Tenant, (tenant) => tenant.tenantstrategies, { onDelete: 'NO ACTION' })
    @JoinColumn({ name: "tenantId" }) 
    tenant!: Tenant;

    @Column({ 
        name: 'tenant_strategy_name',
        type: "varchar", 
        length: 50, 
        nullable: true
    })
    tenantStrategyName!: string;

    @Column({ 
        name: 'tenant_strategy', 
        type: 'nvarchar', 
        length: 50 
    })
    tenantStrategy!: string;    

    @Column({ nullable: true })
    createdByUserId!: number;
}

