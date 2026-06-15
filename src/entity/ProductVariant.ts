



// src/entity/Productvariant.ts
import { Entity, PrimaryColumn, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Product } from './Product';

interface ITierPrices{
    [categoryName:string]:number
}

interface IProductCustomAttributes{
    tier_prices:ITierPrices;
    [key:string]:any
}

// This class defines the structure of your 'Productvariant' table in the database.
@Entity({ name: 'Productvariant' }) 
export class Productvariant {

    @PrimaryGeneratedColumn()
    id!: number;
 
    @Column({  name: 'sku', type: 'nvarchar', length: 50 , nullable:true})
    sku!: string|null; 
     
    @ManyToOne(() => Product)
    product!: Product;


    @Column()
    variantName!: string; //500gm packet or 250gms packet

    @Column({  name: 'base_price', type: 'decimal', precision:10, scale:2, nullable:true })
    basePrice!: number;

    @Column({type:"simple-json",nullable:true})
    customAttributes!:IProductCustomAttributes|null

    //crucial: How many base units (grms) are in this specific variant
    @Column({  type: 'decimal', precision:10, scale:2 })
    conversionFactor!: number;


    @Column({ nullable:true})
    createdByUserId!:number;
    
}

