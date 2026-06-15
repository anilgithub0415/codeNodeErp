//? Autocode base for client
//? what is requiremnet details




// src/entity/Customer.ts
import { Entity, PrimaryColumn, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, OneToMany, Index } from 'typeorm';
import { Tenant } from './Tenant';
import { Organisation } from './Organisation';

// This class defines the structure of your 'Customer' table in the database.
@Entity({ name: 'Customer' }) 
@Index(['tenantId', 'customerName'], { unique: true }) 
export class Customer {

    @PrimaryGeneratedColumn()
    id!: number;
 
    @Column({type:'int'})
    tenantId!:number;
    
    @ManyToOne(() => Tenant, (tenant) => tenant.customers, { onDelete: 'NO ACTION' })
            @JoinColumn({ name: "tenantId" }) // Maps the relation to the column above
            tenant!: Tenant;

    @Column({  name: 'customer_name', type: 'nvarchar', length: 50 })
    customerName!: string; 

    @Column({type: 'nvarchar', length: 50})
    LeadStatus!:string;
   
  @OneToMany(() => Organisation, org => org.customer, { cascade: true })
  organisations!: Organisation[];
   
    @Column({ nullable:true})
    createdByUserId!:number;
    
}

