// src/entity/Product.ts
import { Entity, PrimaryColumn, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Tenant } from './Tenant';
import { HsnTaxRule } from './HsnTaxRule';
import { ProductCategory } from './ProductCategory'; // 🌟 Imported new entity

interface ITierPrices {
    [categoryName: string]: number;
}

interface IProductCustomAttributes {
    tier_prices: ITierPrices;
    [key: string]: any;
}

@Entity({ name: 'Product' }) 
@Index(['tenantId', 'prodName'], { unique: true }) 
export class Product {

    @PrimaryGeneratedColumn()
    id!: number;
 
    @Column({ type: 'int' })
    tenantId!: number;
      
    @ManyToOne(() => Tenant, (tenant) => tenant.products, { onDelete: 'NO ACTION' })
    @JoinColumn({ name: "tenantId" }) 
    tenant!: Tenant;

    @Column({ name: 'prod_name', type: 'nvarchar', length: 20 })
    prodName!: string; 

    @Column({ name: 'description', type: 'nvarchar', length: 20, nullable: true })
    description!: string | null;

    @Column({ name: 'sku', type: 'nvarchar', length: 50, nullable: true })
    sku!: string | null; 

    @Column({ name: 'base_price', type: 'decimal', precision: 10, scale: 2, nullable: true })
    basePrice!: number;
 
    @Column({ type: 'bit', default: false })
    isVariablePrice!: boolean;

    @Column({ type: 'bit', default: true })
    isActive!: boolean;

    @Column({ type: "simple-json", nullable: true })
    customAttributes!: IProductCustomAttributes | null;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    currentstock!: number;

    @Column({ type: 'bit', default: false })
    isOEMProduct!: boolean;

    @Column({ type: 'bit', default: false })
    isBulkPacking!: boolean;

    @Column({ nullable: true })
    reorderLevel!: number;

    @Column({ nullable: true })
    createdByUserId!: number;

    @Column({ name: 'base_uom', type: 'nvarchar', length: 20, default: 'PCS' })
    baseUom!: string; 

    @Column({ name: 'default_purchase_uom', type: 'nvarchar', length: 20, nullable: true })
    defaultPurchaseUom!: string; 

    @Column({ name: 'default_sales_uom', type: 'nvarchar', length: 20, nullable: true })
    defaultSalesUom!: string; 
    
    // 🌟 ADDED CATEGORY RELATIONSHIP LINE ITEMS:
    @Column({ type: 'int', nullable: true }) // Nullable: true protects existing legacy rows
    categoryId!: number | null;

    @ManyToOne(() => ProductCategory, (category) => category.products, { onDelete: 'NO ACTION' })
    @JoinColumn({ name: "categoryId" })
    productCategory!: ProductCategory | null;

    // TAX COMPLIANCE RELATIONSHIP:
    @Column({ type: 'int', nullable: true }) 
    hsnId!: number;

    @ManyToOne(() => HsnTaxRule, { onDelete: 'NO ACTION' }) 
    @JoinColumn({ name: "hsnId" })
    hsnTaxRule!: HsnTaxRule;
}
