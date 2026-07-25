// src/entity/ProductTemplate.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany, Index } from 'typeorm';
import { Tenant } from './Tenant';
import { ProductVariant } from './productVariant';
import { HsnTaxRule } from './HsnTaxRule';
import { ProductCategory } from './ProductCategory'; // 🌟 Imported new category entity

@Entity({ name: 'ProductTemplate' }) 
@Index(['tenantId', 'prodName'], { unique: true }) // Prevents identical product names within the same tenant

export class ProductTemplate {

    @PrimaryGeneratedColumn()
    id!: number;
 
    @Column({ type: 'int' })
    tenantId!: number;
      
    @ManyToOne(() => Tenant, (tenant) => tenant.products, { onDelete: 'NO ACTION' })
    @JoinColumn({ name: "tenantId" })
    tenant!: Tenant;

    @Column({ name: 'prod_name', type: 'nvarchar', length: 100 }) // Increased length for descriptive template names
    prodName!: string; 
    
    @Column({ name: 'description', type: 'nvarchar', length: 500, nullable: true }) // Increased length for rich details
    description!: string | null;

    @Column({ name: 'sku', type: 'nvarchar', length: 50, unique: true }) // Added unique constraint for standard B2B lookups
    sku!: string; 
    
    @Column({ type: 'bit', default: true })
    isActive!: boolean;

    // Visibility configuration rules apply to the entire family series
    @Column({ type: 'bit', default: false })
    isOEMProduct!: boolean;

    @Column({ type: 'bit', default: false })
    isBulkPacking!: boolean;

    @Column({ nullable: true })
    createdByUserId!: number;

    //for default units
    @Column({ name: 'base_uom', type: 'nvarchar', length: 20, default: 'PCS' })
    baseUom!: string; // The system inventory baseline (e.g., 'PCS', 'KG')

    @Column({ name: 'default_purchase_uom', type: 'nvarchar', length: 20, default: 'BOX' })
    defaultPurchaseUom!: string; // Auto-populates Purchase Orders

    @Column({ name: 'default_sales_uom', type: 'nvarchar', length: 20, default: 'PCS' })
    defaultSalesUom!: string; // Auto-populates Sales Orders

    // 🌟 ADDED CATEGORY RELATIONSHIP LINE ITEMS:
    @Column({ type: 'int', nullable: true }) // Nullable: true protects existing legacy rows during migrations
    categoryId!: number | null;

    @ManyToOne(() => ProductCategory, { onDelete: 'NO ACTION' })
    @JoinColumn({ name: "categoryId" })
    productCategory!: ProductCategory | null;

    // 🌟 ADD THESE LINE ITEMS FOR TAX COMPLIANCE:
    @Column({ type: 'int', nullable: false }) // Make it nullable: true temporary if you have existing seed data
    hsnId!: number;

    @ManyToOne(() => HsnTaxRule, { onDelete: 'NO ACTION' }) 
    @JoinColumn({ name: "hsnId" })
    hsnTaxRule!: HsnTaxRule;

    // One-to-Many connection establishing relationship down to Detail Variants
    @OneToMany(() => ProductVariant, (variant) => variant.productTemplate, { cascade: true })
    variants!: ProductVariant[];
}
