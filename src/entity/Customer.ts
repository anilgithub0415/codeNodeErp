// src/entity/Customer.ts
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, OneToMany, Index } from 'typeorm';
import { Tenant } from './Tenant';
import { CustomerCategory } from './CustomerCategory';

@Entity({ name: 'Customer' }) 
@Index(['tenantId', 'customerName'], { unique: true }) 
export class Customer {

    @PrimaryGeneratedColumn()
    id!: number;
 
    @Column({ type: 'int' })
    tenantId!: number;
    
    @ManyToOne(() => Tenant, (tenant) => tenant.customers, { onDelete: 'NO ACTION' })
    @JoinColumn({ name: "tenantId" }) 
    tenant!: Tenant;

    @Column({ name: 'customer_name', type: 'nvarchar', length: 50 })
    customerName!: string; 

    @Column({ name: 'CommercialContactPerson', nullable: true })
    commercialContactPerson!: string;

     @Column({ name: 'CommercialContactPhone', nullable: true })
    commercialContactPhone!: string;

    @Column({ name: 'customer_category', type: 'varchar', length: 100, nullable: true }) 
    customerCategoryId!: string;

    @ManyToOne(() => CustomerCategory)
    @JoinColumn({ name: 'customer_category' })
    customerCategory!: CustomerCategory;

    @Column({ type: 'nvarchar', length: 50, nullable: true })
    clientStatus!: string;

      

    @Column({ nullable: true })
    EmailId?: string;   

    @Column({ nullable: true })
    city?: number;  
 
    @Column({ name: 'credit_days', type: 'int', nullable: true })
    creditDays!: number;

    @Column({ name: 'credit_limit', type: 'int', nullable: true })
    creditLimit!: number;
  
    @Column({ type: 'nvarchar', length: 50, nullable: true })
    leadSource!: string;
   
    // 💡 Broken Cycle: Mapped using string relation identifier 'Site'
    @OneToMany('Site', 'customer', { cascade: true })
    sites!: any[];

    // 💡 Broken Cycle: Mapped using string relation identifier 'User'
    @OneToMany('User', 'client')
    users!: any[]; 
     
    @Column({ nullable: true })
    createdByUserId!: number;
}
