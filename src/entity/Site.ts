  // src/entity/Site.ts
import { User } from './User';
// src/entity/Site.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Index,
  JoinColumn,
  RelationId,
  OneToMany,
} from 'typeorm';
import { Customer } from './Customer';
import { CustomerCategory } from './CustomerCategory';

@Entity()
export class Site {
  @PrimaryGeneratedColumn()
  id!: number;
//pending: check whether few more precautions need for tenantId constraints
  @Column({type:'int'})
    tenantId!:number;
    
  @Column()
  siteName!: string;                     // e.g. “ABC Ltd”, “XYZ Ltd” 


  @Column({nullable:true})
  contactPersonName!:string;

  // FK back to the client
  @ManyToOne(() => Customer, cust => cust.sites, {
    onDelete: 'NO ACTION',  
  })
  @Index()
  customer!: Customer;


// ... inside your Site class definition:

  @OneToMany(() => User, (user) => user.site)
  users!: User[]; // 👈 Array representing all credential accounts assigned to this site

}