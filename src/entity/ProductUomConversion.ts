// src/entity/ProductUomConversion.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Check, Unique, Index } from 'typeorm';
import { Tenant } from './Tenant';
import { Product } from './Product';
import { ProductVariant } from './productVariant';

@Entity({ name: 'product_uom_conversions' })
@Check(`("product_id" IS NOT NULL AND "product_variant_id" IS NULL) OR ("product_id" IS NULL AND "product_variant_id" IS NOT NULL)`)

// 🌟 UNIQUE INDEX FOR PRODUCTS
@Index('IDX_product_uom_product', ['tenantId', 'productId', 'purchaseUom'], {
  unique: true,
  where: '"product_id" IS NOT NULL'
})

// 🌟 UNIQUE INDEX FOR PRODUCT VARIANTS
@Index('IDX_product_uom_variant', ['tenantId', 'productVariantId', 'purchaseUom'], {
  unique: true,
  where: '"product_variant_id" IS NOT NULL'
})
export class ProductUomConversion {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'int' })
    tenantId!: number;

    @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'tenantId' })
    tenant!: Tenant;

    // --- LINK TO FLAT PRODUCT ---
    @Column({ name: 'product_id', type: 'int', nullable: true })
    productId!: number | null;

    @ManyToOne(() => Product, { onDelete: 'CASCADE', nullable: true })
    @JoinColumn({ name: 'product_id' })
    product!: Product | null;

    // --- LINK TO VARIANT PRODUCT ---
    @Column({ name: 'product_variant_id', type: 'int', nullable: true })
    productVariantId!: number | null;

    @ManyToOne(() => ProductVariant, { onDelete: 'CASCADE', nullable: true })
    @JoinColumn({ name: 'product_variant_id' })
    productVariant!: ProductVariant | null;

    // --- MEASUREMENT CONVERSION RULES ---
    @Column({ name: 'purchase_uom', type: 'nvarchar', length: 20 }) 
    purchaseUom!: string; // e.g., 'Box', 'Pallet', 'Crate'

    @Column({ name: 'sale_uom', type: 'nvarchar', length: 20 }) 
    saleUom!: string; // e.g., 'Piece', 'Meter'

    // The magical multiplier factor!
    // Example: If 1 Box has 24 pieces, factor is 24.00
    @Column({ name: 'conversion_factor', type: 'decimal', precision: 10, scale: 4, default: 1.0000 })
    conversionFactor!: number;
}
