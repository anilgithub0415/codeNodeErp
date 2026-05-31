



// src/entity/Product.ts
import { Entity, PrimaryColumn, Column, PrimaryGeneratedColumn } from 'typeorm';

interface ITierPrices{
    [categoryName:string]:number
}

interface IProductCustomAttributes{
    tier_prices:ITierPrices;
    [key:string]:any
}
// This class defines the structure of your 'Product' table in the database.
@Entity({ name: 'Product' }) 
export class Product {

    @PrimaryGeneratedColumn()
    id!: number;
 
    @Column({name:"tenant_id",type:'nvarchar'})
    tenantId!:string;
      
    @Column({  name: 'prod_name', type: 'nvarchar', length: 20 })
    prodName!: string; 

    @Column({  name: 'description', type: 'nvarchar', length: 20, nullable:true })
    description!: string|null;

    @Column({  name: 'sku', type: 'nvarchar', length: 50 , nullable:true})
    sku!: string|null; 

    @Column({  name: 'base_price', type: 'decimal', precision:10, scale:2, nullable:true })
    basePrice!: number;
 
    @Column({type:'bit',default:true})
    isActive!:boolean;

     @Column({type:"simple-json",nullable:true})
    customAttributes!:IProductCustomAttributes|null
 

    @Column({ nullable:true})
    createdByUserId!:number;
    
}

