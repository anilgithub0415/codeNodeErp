



// src/entity/District.ts
import { Entity, PrimaryColumn, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Tenant } from './Tenant';


// This class defines the structure of your 'District' table in the database.
@Entity({ name: 'District' }) 
export class District {

    @PrimaryGeneratedColumn()
    id!: number;
 
     @Column({type:'int'}) 
    tenantId!:number;
      
    @ManyToOne(() => Tenant, (tenant) => tenant.districts, { onDelete: 'NO ACTION' })
         @JoinColumn({ name: "tenantId" }) // Maps the relation to the column above
         tenant!: Tenant;

    @Column({  name: 'district_name', type: 'nvarchar', length: 20 })
    districtName!: string; 

    @Column({ type: 'nvarchar', length: 500, nullable: true })
    description?: string | null;

    @Column({ nullable:true})
    createdByUserId!:number;
    
}

