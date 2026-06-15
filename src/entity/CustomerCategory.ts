



// src/entity/CustomerCategory.ts
import { Entity, PrimaryColumn, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Tenant } from './Tenant';
import { Organisation } from './Organisation';

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

  @OneToMany(() => Organisation, org => org.customerCategory)
  organisations!: Organisation[];
   
    @Column({ nullable:true})
    createdByUserId!:number;
    
}

