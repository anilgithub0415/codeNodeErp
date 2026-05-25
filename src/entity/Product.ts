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
 
    @Column()
    tenantId!:string;
    
    @Column({  name: 'prod_name', type: 'nvarchar', length: 20 })
    prod_name!: string; 

    @Column({  name: 'description', type: 'nvarchar', length: 20, nullable:true })
    description!: string;

    @Column({  name: 'sku', type: 'nvarchar', unique:true, length: 50 })
    sku!: string;

    @Column({  name: 'base_price', type: 'decimal', precision:10, scale:2, nullable:true })
    base_price!: string;
 
    @Column({type:"simple-json",nullable:true})
    customAttributes!:IProductCustomAttributes
 

    
}