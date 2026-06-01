



// src/entity/Customer.ts
import { Entity, PrimaryColumn, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Tenant } from './Tenant';

// This class defines the structure of your 'Customer' table in the database.
@Entity({ name: 'Customer' }) 
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

    @Column({  name: 'customer_category', type: 'nvarchar', length: 50 })
    customerCategory!: string;    

   
    @Column({ nullable:true})
    createdByUserId!:number;
    
}

