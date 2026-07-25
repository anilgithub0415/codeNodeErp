import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Check } from 'typeorm';
import { SalesOrder } from './SalesOrder';
import { Product } from './Product';
import { ProductVariant } from './productVariant';

@Entity('sales_order_items')
// 🌟 DATABASE PROTECTION: Guarantees exactly one relationship is populated
@Check(`("product_id" IS NOT NULL AND "product_variant_id" IS NULL) OR ("product_id" IS NULL AND "product_variant_id" IS NOT NULL)`)
export class SalesOrderItem {
    
    @PrimaryGeneratedColumn('increment')
    id!: number;

    @Column({ name: 'sales_order_id', type: 'int' })
    salesOrderId!: number;

    @ManyToOne(() => SalesOrder, (order) => order.items, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'sales_order_id' })
    salesOrder!: SalesOrder;

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
    @Column({ type: 'varchar', length: 100 })
    prodName!: string;  

    @Column({ type: 'varchar', length: 50, nullable: true })
    sku!: string | null;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 1.00 })
    quantity!: number;

    // UNIFIED: Renamed database column metadata target from 'finalPrice' to 'finalPrice' to match Purchase convention precisely
    @Column({ name: 'finalPrice', type: 'decimal', precision: 10, scale: 2, default: 0.00, transformer: {
    to: (value: number) => value,
    from: (value: string) => parseFloat(value)
  } })
    finalPrice!: number; 

    // UNIFIED: Shifted property parameters from 'saleUom nvarchar' over to 'sales_uom varchar' matching purchase_uom
    @Column({ name: 'sales_uom', type: 'varchar', length: 20, nullable: true })
    salesUom!: string | null; 

    @Column({ type: 'simple-json', nullable: true })
    customAttributes!: Record<string, any> | null;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;
}
