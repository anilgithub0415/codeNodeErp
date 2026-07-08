



// src/entity/CustomerCategory.ts
import { Entity, PrimaryColumn, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Tenant } from './Tenant';
import { Site } from './Site';
import { Customer } from './Customer';

// This class defines the structure of your 'CustomerCategory' table in the database.
@Entity({ name: 'CustomerCategory' }) 
export class CustomerCategory {

  
 
    @Column({type:'int'})
    tenantId!:number;
    
    @ManyToOne(() => Tenant, (tenant) => tenant.customers, { onDelete: 'NO ACTION' })
            @JoinColumn({ name: "tenantId" }) // Maps the relation to the column above
            tenant!: Tenant;

            
 @PrimaryColumn({ type: 'varchar', length: 100 })
  customerCategory!: string;

  @OneToMany(() => Customer, cust => cust.customerCategory)
  sites!: Site[];
   
    @Column({ nullable:true})
    createdByUserId!:number;
    
}

