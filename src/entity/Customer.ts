//? Autocode base for client
//? what is requiremnet details




// src/entity/Customer.ts
import { Entity, PrimaryColumn, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, OneToMany, Index } from 'typeorm';
import { Tenant } from './Tenant';
import { Site } from './Site';
import { CustomerCategory } from './CustomerCategory';

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
 // 1. Writable, raw foreign-key value column (Safe to read and write)
  // Inside Site Entity
@Column({ name: 'customer_category', type: 'varchar', length: 100, nullable: true }) // 👈 Explicitly match type
customerCategoryId!: string;

@ManyToOne(() => CustomerCategory)
@JoinColumn({ name: 'customer_category' })
customerCategory!: CustomerCategory;

    @Column({type: 'nvarchar', length: 50, nullable:true})
    clientStatus!:string;

  @Column({ nullable: true })
  mobileNumber?: string;    


  @Column({ nullable: true })
  EmailId?: string;   


  @Column({ nullable: true })
  city?: number;  
 
  @Column({  name: 'credit_days', type: 'int',  nullable:true })
    creditDays!: number;

  @Column({  name: 'credit_limit', type: 'int',  nullable:true })
    creditLimit!: number;
  
    @Column({type: 'nvarchar', length: 50, nullable:true})
    leadSource!:string;
   
  @OneToMany(() => Site, site => site.customer, { cascade: true })
  sites!: Site[];
   
    @Column({ nullable:true})
    createdByUserId!:number;
    
}

