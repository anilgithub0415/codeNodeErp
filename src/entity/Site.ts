// src/entity/Site.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Index, JoinColumn, OneToMany } from 'typeorm';
import { Customer } from './Customer'; // 🌟 Ensure you import your Customer entity

@Entity({ name: 'site' }) 
export class Site {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index("IX_Site_TenantId") 
  @Column({ type: 'int' })
  tenantId!: number;

  @Column()
  siteName!: string;                     

  @Column({ nullable: true })
  siteContactPerson!: string;

  @Index("IX_Site_clientId", ["clientId"]) 
  @Column({ type: 'int', nullable: false, name: 'ClientId' })
  clientId!: number;

  // 🌟 FIX: Change 'Customer' string to a structural arrow function returning the Class Type
  @ManyToOne(() => Customer, (customer) => customer.sites, { nullable: false, onDelete: 'CASCADE' }) 
  @JoinColumn({ name: 'ClientId' })
  customer!: Customer; // 🌟 Type cleanly as Customer instead of any

  @OneToMany('User', 'site')
  users!: any[]; 
}
