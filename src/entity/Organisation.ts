// src/entity/Organisation.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Index,
  JoinColumn,
} from 'typeorm';
import { Customer } from './Customer';
import { CustomerCategory } from './CustomerCategory';

@Entity()
export class Organisation {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  organisationName!: string;                     // e.g. “ABC Ltd”, “XYZ Ltd” 

   @ManyToOne(() => CustomerCategory, { eager: true })
  @JoinColumn({ 
    name: 'customer_category', // Column name in the Organisation table
    referencedColumnName: 'customerCategory' // Column name in the CustomerCategory table
  })
  customerCategory!: CustomerCategory;

   @Column({ nullable: true })
  contactPersonName?: string;        // e.g. “Alice Johnson”

  @Column({ nullable: true })
  mobileNumber?: string;             // e.g. “+1‑555‑123‑4567”

  @Column({ nullable: true })
  EmailId?: string;   

  @Column({ nullable: true })
  city?: string;  

  @Column({ nullable: true })
  Remarks?: string;  
  

  @Column({  name: 'credit_days', type: 'int',  nullable:true })
    creditDays!: number;

  @Column({  name: 'credit_limit', type: 'int',  nullable:true })
    creditLimit!: number;
  
  // FK back to the client
  @ManyToOne(() => Customer, cust => cust.organisations, {
    onDelete: 'NO ACTION',  
  })
  @Index()
  customer!: Customer;
}