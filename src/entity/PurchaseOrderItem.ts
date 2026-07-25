import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Check } from 'typeorm';
import { PurchaseOrder } from './PurchaseOrder';
import { Product } from './Product';
import { ProductVariant } from './productVariant'; // Make sure path matches your file structure

@Entity('purchase_order_items')
// 🌟 DATABASE PROTECTION: Guarantees exactly one relationship is populated
@Check(`("product_id" IS NOT NULL AND "product_variant_id" IS NULL) OR ("product_id" IS NULL AND "product_variant_id" IS NOT NULL)`)
export class PurchaseOrderItem {
    
    @PrimaryGeneratedColumn('increment')
    id!: number;

    @Column({ name: 'purchase_order_id', type: 'int' })
    purchaseOrderId!: number;

    @ManyToOne(() => PurchaseOrder, (order) => order.items, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'purchase_order_id' })
    purchaseOrder!: PurchaseOrder;

    // --- RELATION 1: FLAT PRODUCT ---
    @Column({ name: 'product_id', type: 'int', nullable: true })
    productId!: number | null;

    @ManyToOne(() => Product, { onDelete: 'NO ACTION', nullable: true })
    @JoinColumn({ name: 'product_id' })
    product!: Product | null;

    // --- RELATION 2: VARIANT PRODUCT ---
    @Column({ name: 'product_variant_id', type: 'int', nullable: true })
    productVariantId!: number | null;

    @ManyToOne(() => ProductVariant, { onDelete: 'NO ACTION', nullable: true })
    @JoinColumn({ name: 'product_variant_id' })
    productVariant!: ProductVariant | null;

    // --- TRANSACTIONAL SNAPSHOTS ---
    // Critical for audit compliance: stores values exactly as they were when purchased
    @Column({ type: 'varchar', length: 100 })
    prodName!: string;

    @Column({ type: 'varchar', length: 50, nullable: true })
    sku!: string | null;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 1.00 })
    quantity!: number;

    // Renamed from 'price' to 'finalPrice' to match billing conventions
    @Column({ name: 'finalPrice', type: 'decimal', precision: 10, scale: 2, default: 0.00 })
    finalPrice!: number;

    // Add this tracking property inside your PurchaseOrderItem.ts entity file
    @Column({ name: 'purchase_uom', type: 'varchar', length: 20, nullable: true })
    purchaseUom!: string | null;


    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;
}
