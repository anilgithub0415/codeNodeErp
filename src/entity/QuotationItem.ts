// import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Check } from 'typeorm';
// import { Quotation } from './Quotation';

// @Check(`"quantity" >= 0 AND "gst_percentage" >= 0 AND "price" >= 0 AND "discount" >= 0 AND "total_item_amount" >= 0`)
// @Entity('quotation_items')
// export class QuotationItem {
    
//     @PrimaryGeneratedColumn('increment')
//     id!: number;

//     @Column({ name: 'quotation_id', type: 'int' })
//     quotationId!: number;

//     @ManyToOne(() => Quotation, (quotation) => quotation.items, { onDelete: 'CASCADE' })
//     @JoinColumn({ name: 'quotation_id' })
//     quotation!: Quotation;

//     @Column({ name: 'product_name', type: 'varchar', length: 255 })
//     productName!: string;

//     @Column({ name: 'description', type: 'nvarchar', length: 'MAX', nullable: true })
//     description!: string | null;

//     @Column({ name: 'unit', type: 'varchar', length: 20 })
//     unit!: string;

//     @Column({ name: 'quantity', type: 'decimal', precision: 10, scale: 2, default: 0.00 })
//     quantity!: number;

//     @Column({ name: 'gst_percentage', type: 'decimal', precision: 5, scale: 2, default: 0.00 })
//     gstPercentage!: number;

//     @Column({ name: 'price', type: 'decimal', precision: 12, scale: 2, default: 0.00 })
//     price!: number;

//     @Column({ name: 'discount', type: 'decimal', precision: 12, scale: 2, default: 0.00 })
//     discount!: number;

//     @Column({ name: 'total_item_amount', type: 'decimal', precision: 14, scale: 2, default: 0.00 })
//     totalItemAmount!: number;

//     @CreateDateColumn({ name: 'created_at' })
//     createdAt!: Date;

//     @UpdateDateColumn({ name: 'updated_at' })
//     updatedAt!: Date;
// }


// import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Check } from 'typeorm';
// import { Quotation } from './Quotation';
// import { Product } from './Product';
// import { ProductVariant } from './productVariant';

// @Entity('quotation_items')
// // 🌟 DUAL PROTECTION CHECK: 
// // 1. Guarantees exactly one product relationship is populated (Flat vs Variant).
// // 2. Enforces non-negative calculations for pricing fields.
// @Check(`
//   (("product_id" IS NOT NULL AND "product_variant_id" IS NULL) OR ("product_id" IS NULL AND "product_variant_id" IS NOT NULL))
//   AND "quantity" >= 0 
//   AND "gst_percentage" >= 0 
//   AND "price" >= 0 
//   AND "discount" >= 0 
//   AND "total_item_amount" >= 0
// `)
// export class QuotationItem {
    
//     @PrimaryGeneratedColumn('increment')
//     id!: number;

//     @Column({ name: 'quotation_id', type: 'int' })
//     quotationId!: number;

//     @ManyToOne(() => Quotation, (quotation) => quotation.items, { onDelete: 'CASCADE' })
//     @JoinColumn({ name: 'quotation_id' })
//     quotation!: Quotation;

//     // --- RELATION 1: FLAT PRODUCT (Aligned with SalesOrderItem) ---
//     @Column({ name: 'product_id', type: 'int', nullable: true })
//     productId!: number | null;

//     @ManyToOne(() => Product, { onDelete: 'NO ACTION', nullable: true })
//     @JoinColumn({ name: 'product_id' })
//     product!: Product | null;

//     // --- RELATION 2: VARIANT PRODUCT (Aligned with SalesOrderItem) ---
//     @Column({ name: 'product_variant_id', type: 'int', nullable: true })
//     productVariantId!: number | null;

//     @ManyToOne(() => ProductVariant, { onDelete: 'NO ACTION', nullable: true })
//     @JoinColumn({ name: 'product_variant_id' })
//     productVariant!: ProductVariant | null;

//     // --- TRANSACTIONAL SNAPSHOTS & ALIGNED PROPERTIES ---
//     @Column({ name: 'prodName', type: 'varchar', length: 100 })  
//     prodName!: string;  

//     @Column({ type: 'varchar', length: 50, nullable: true })
//     sku!: string | null;

//     @Column({ name: 'description', type: 'nvarchar', length: 'MAX', nullable: true })
//     description!: string | null;

//     @Column({ name: 'unit', type: 'varchar', length: 20 })
//     unit!: string;

//     @Column({ name: 'quantity', type: 'decimal', precision: 10, scale: 2, default: 0.00 })
//     quantity!: number;

//     @Column({ name: 'gst_percentage', type: 'decimal', precision: 5, scale: 2, default: 0.00 })
//     gstPercentage!: number;

//     @Column({ name: 'price', type: 'decimal', precision: 12, scale: 2, default: 0.00 })
//     price!: number;

//     @Column({ name: 'discount', type: 'decimal', precision: 12, scale: 2, default: 0.00 })
//     discount!: number;

//     @Column({ name: 'total_item_amount', type: 'decimal', precision: 14, scale: 2, default: 0.00 })
//     totalItemAmount!: number;

//     @Column({ type: 'simple-json', nullable: true })
//     customAttributes!: Record<string, any> | null;

//     @CreateDateColumn({ name: 'created_at' })
//     createdAt!: Date;

//     @UpdateDateColumn({ name: 'updated_at' })
//     updatedAt!: Date;
// }

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Check } from 'typeorm';
import { Quotation } from './Quotation';
import { Product } from './Product';
import { ProductVariant } from './productVariant';
import { LineDiscount } from './LineDiscount'; // 🌟 Import line discount entity

@Entity('quotation_items')
@Check(`
  (("product_id" IS NOT NULL AND "product_variant_id" IS NULL) OR ("product_id" IS NULL AND "product_variant_id" IS NOT NULL))
  AND "quantity" >= 0 
  AND "gst_percentage" >= 0 
  AND "customPrice" >= 0 
  AND "discount" >= 0 
  AND "total_item_amount" >= 0
`)
export class QuotationItem {
    
    @PrimaryGeneratedColumn('increment')
    id!: number;

    @Column({ name: 'quotation_id', type: 'int' })
    quotationId!: number;

    @ManyToOne(() => Quotation, (quotation) => quotation.items, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'quotation_id' })
    quotation!: Quotation;

    @Column({ name: 'product_id', type: 'int', nullable: true })
    productId!: number | null;

    @ManyToOne(() => Product, { onDelete: 'NO ACTION', nullable: true })
    @JoinColumn({ name: 'product_id' })
    product!: Product | null;

    @Column({ name: 'product_variant_id', type: 'int', nullable: true })
    productVariantId!: number | null;

    @ManyToOne(() => ProductVariant, { onDelete: 'NO ACTION', nullable: true })
    @JoinColumn({ name: 'product_variant_id' })
    productVariant!: ProductVariant | null;

    // 🌟 RELATION LINK: Identifies which standard discount strategy rule generated this discount snapshot
    @Column({ name: 'applied_line_discount_id', type: 'int', nullable: true })
    appliedLineDiscountId!: number | null;

    @ManyToOne(() => LineDiscount, { onDelete: 'NO ACTION', nullable: true })
    @JoinColumn({ name: 'applied_line_discount_id' })
    appliedLineDiscount!: LineDiscount | null;

    @Column({ name: 'prodName', type: 'varchar', length: 100 })  
    prodName!: string;  

    @Column({ type: 'varchar', length: 50, nullable: true })
    sku!: string | null;

    @Column({ name: 'description', type: 'nvarchar', length: 'MAX', nullable: true })
    description!: string | null;

    @Column({ name: 'unit', type: 'varchar', length: 20 })
    unit!: string;

    @Column({ name: 'quantity', type: 'decimal', precision: 10, scale: 2, default: 0.00 })
    quantity!: number;

    @Column({ name: 'gst_percentage', type: 'decimal', precision: 5, scale: 2, default: 0.00 })
    gstPercentage!: number;

    @Column({ name: 'customPrice', type: 'decimal', precision: 12, scale: 2, default: 0.00 })
    customPrice!: number;

    @Column({ name: "target_price", type: "decimal", precision: 12, scale: 2, nullable: true })
    targetPrice!: number | null;

    @Column({ name: 'discount', type: 'decimal', precision: 12, scale: 2, default: 0.00 })
    discount!: number; // Store total calculated currency reduction amount here

    @Column({ name: 'total_item_amount', type: 'decimal', precision: 14, scale: 2, default: 0.00 })
    totalItemAmount!: number;

    @Column({ type: 'simple-json', nullable: true })
    customAttributes!: Record<string, any> | null;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;
}
