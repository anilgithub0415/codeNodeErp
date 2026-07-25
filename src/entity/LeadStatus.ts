
//NewLead
//ContactPending
//ReqDiscussion
//QuoteSent
//FollowUpPending
//Converted
//LostLead


// src/entity/ClientStatus.ts
import { Entity, PrimaryColumn, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Tenant } from './Tenant';

// This class defines the structure of your 'ClientStatus' table in the database.
@Entity({ name: 'ClientStatus' }) 
export class ClientStatus {

    @PrimaryGeneratedColumn()
    id!: number;
 
    @Column({type:'int'})
    tenantId!:number;
   
    @Column({  name: 'lead_status', type: 'nvarchar', length: 50 })
    clientStatus!: string; 

   
    @Column({ nullable:true})
    createdByUserId!:number;
    
}

