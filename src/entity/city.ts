



// src/entity/City.ts
import { Entity, PrimaryColumn, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Tenant } from './Tenant';


// This class defines the structure of your 'City' table in the database.
@Entity({ name: 'City' }) 
export class City {

    @PrimaryGeneratedColumn()
    id!: number;
 
     @Column({type:'int'}) 
    tenantId!:number;
      
    @ManyToOne(() => Tenant, (tenant) => tenant.citys, { onDelete: 'NO ACTION' })
         @JoinColumn({ name: "tenantId" }) // Maps the relation to the column above
         tenant!: Tenant;

    @Column({  name: 'city_Abbrevation', type: 'nvarchar', length: 20 })
    cityAbbrevation!: string; 

    @Column({  name: 'city_name', type: 'nvarchar', length: 20 })
    cityName!: string; 
 
    @Column({ nullable:true})
    createdByUserId!:number;
    
}

