



// src/entity/Customer.ts
import { Entity, PrimaryColumn, Column, PrimaryGeneratedColumn } from 'typeorm';

// This class defines the structure of your 'Customer' table in the database.
@Entity({ name: 'Customer' }) 
export class Customer {

    @PrimaryGeneratedColumn()
    id!: number;
 
    @Column({name:"tenant_id",type:'nvarchar'})
    tenantId!:string;
      
    @Column({  name: 'customer_name', type: 'nvarchar', length: 50 })
    customerName!: string; 

    @Column({  name: 'customer_category', type: 'nvarchar', length: 50 })
    customerCategory!: string;    

   
    @Column({ nullable:true})
    createdByUserId!:number;
    
}

