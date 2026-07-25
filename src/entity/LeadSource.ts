



// src/entity/Leadsource.ts
import { Entity, PrimaryColumn, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Tenant } from './Tenant';

// This class defines the structure of your 'Leadsource' table in the database.
@Entity({ name: 'Leadsource' }) 
export class Leadsource {

    @PrimaryGeneratedColumn()
    id!: number;
 
    @Column({type:'int'})
    tenantId!:number;
   
    @Column({  name: 'lead_source', type: 'nvarchar', length: 50 })
    leadSource!: string; 

   
    @Column({ nullable:true})
    createdByUserId!:number;
    
}

