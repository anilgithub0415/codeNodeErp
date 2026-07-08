// src/entity/ProductVariant.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ProductTemplate } from './product_template';

interface ITierPrices {
    [categoryName: string]: number;
}

interface IProductCustomAttributes {
    tier_prices: ITierPrices;
    [key: string]: any;
}

@Entity({ name: 'ProductVariant' })
export class ProductVariant {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'int' })
    productTemplateId!: number;

    // Many-to-One connection mapping child configurations securely back up to Master Template
    @ManyToOne(() => ProductTemplate, (template) => template.variants, { onDelete: 'CASCADE' })
    @JoinColumn({ name: "productTemplateId" })
    productTemplate!: ProductTemplate;

    @Column({ name: 'sku', type: 'nvarchar', length: 50, unique: true }) // Added unique constraint for standard B2B lookups
    sku!: string; 

    // Specific variant attribute tracking dimensions tailored for sanitary materials
    @Column({ name: 'size', type: 'nvarchar', length: 20, nullable: true }) // e.g., '1/2"', '3/4"'
    size!: string | null;

    @Column({ name: 'finish', type: 'nvarchar', length: 30, nullable: true }) // e.g., 'Chrome', 'Matte Black'
    finish!: string | null;

    @Column({ name: 'base_price', type: 'decimal', precision: 10, scale: 2 })
    basePrice!: number;
 
    @Column({ type: 'bit', default: false })
    isVariablePrice!: boolean;

    @Column({ type: "simple-json", nullable: true })
    customAttributes!: IProductCustomAttributes | null;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    currentstock!: number;
 
    @Column({ nullable: true })
    reorderLevel!: number;

    @Column({ name: 'stock_uom', type: 'nvarchar', length: 20, default: 'PCS' })
    baseUom!: string;
}
