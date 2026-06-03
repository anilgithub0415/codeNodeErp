



// src/entity/Vendor.ts
import { Entity, PrimaryColumn, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Tenant } from './Tenant';

interface ITierPrices{
    [categoryName:string]:number
}

interface IVendorCustomAttributes{
    tier_prices:ITierPrices;
    [key:string]:any
}
// This class defines the structure of your 'Vendor' table in the database.
@Entity({ name: 'Vendor' }) 
export class Vendor {

    @PrimaryGeneratedColumn()
    id!: number;
 
     @Column({type:'int'})
    tenantId!:number;
      
    @ManyToOne(() => Tenant, (tenant) => tenant.vendors, { onDelete: 'NO ACTION' })
         @JoinColumn({ name: "tenantId" }) // Maps the relation to the column above
         tenant!: Tenant;

    @Column({  name: 'vendor_name', type: 'nvarchar', length: 20 })
    vendorName!: string; 

    @Column({ nullable:true})
    createdByUserId!:number;
    
}

