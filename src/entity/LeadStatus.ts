
//NewLead
//ContactPending
//ReqDiscussion
//QuoteSent
//FollowUpPending
//Converted
//LostLead


// src/entity/LeadStatus.ts
import { Entity, PrimaryColumn, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Tenant } from './Tenant';

// This class defines the structure of your 'LeadStatus' table in the database.
@Entity({ name: 'LeadStatus' }) 
export class LeadStatus {

    @PrimaryGeneratedColumn()
    id!: number;
 
    @Column({type:'int'})
    tenantId!:number;
   
    @Column({  name: 'lead_status', type: 'nvarchar', length: 50 })
    leadStatus!: string; 

   
    @Column({ nullable:true})
    createdByUserId!:number;
    
}

