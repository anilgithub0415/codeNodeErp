import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ClientPurchaseOrder } from './ClientPurchaseOrder';
import { Product } from './Product';
import { ProductVariant } from './productVariant';

@Entity('client_purchase_order_items') // Fixed naming conflict
export class ClientPurchaseOrderItem {
    
    @PrimaryGeneratedColumn('increment')
    id!: number;

        @Column({ name: 'client_purchase_order_id', type: 'int' })
        clientPurchaseOrderId!: number;

    @ManyToOne(() => ClientPurchaseOrder, (order) => order.items, { onDelete: 'CASCADE' }) // Fixed cascade deletion rule
    @JoinColumn({ name: 'client_purchase_order_id' })
    clientPurchaseOrder!: ClientPurchaseOrder;

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
       @Column({ name: 'prod_name', type: 'varchar', length: 100 }) // 👈 Explicit name map fixed your error
prodName!: string;
       @Column({ name: 'sku', type: 'varchar', length: 50, nullable: true })
sku!: string | null;
    
       @Column({ name: 'quantity', type: 'decimal', precision: 10, scale: 2, default: 1.00 })
quantity!: number;
    
        // Renamed from 'price' to 'finalPrice' to match billing conventions
        @Column({ name: 'final_price', type: 'decimal', precision: 10, scale: 2, default: 0.00 }) // 👈 Matches your snake_case DB standard
finalPrice!: number;
        // Add this tracking property inside your PurchaseOrderItem.ts entity file
        @Column({ name: 'purchase_uom', type: 'varchar', length: 20, nullable: true })
purchaseUom!: string | null;
    

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;
}
