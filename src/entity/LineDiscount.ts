import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Tenant } from './Tenant';
import { Product } from './Product';
import { ProductCategory } from './ProductCategory';
import { DiscountType } from './DiscountType';

@Entity({ name: 'LineDiscount' })
@Index(['tenantId', 'discountCode'], { unique: true })
export class LineDiscount {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'int' })
    tenantId!: number;
      
    @ManyToOne(() => Tenant, { onDelete: 'NO ACTION' })
    @JoinColumn({ name: "tenantId" }) 
    tenant!: Tenant;

    @Column({ name: 'discount_code', type: 'nvarchar', length: 30 })
    discountCode!: string;

    @Column({ name: 'description', type: 'nvarchar', length: 100, nullable: true })
    description!: string | null;

   // Replace the old text-based 'discountType' column with this:
    @Column({ name: 'discount_type_id', type: 'int', nullable: true })
    discountTypeId!: number;

    @ManyToOne(() => DiscountType, { onDelete: 'NO ACTION' })
    @JoinColumn({ name: "discount_type_id" })
    discountType!: DiscountType;

    @Column({ name: 'discount_value', type: 'decimal', precision: 10, scale: 2, default: 0.00 })
    discountValue!: number;

    // Direct binding link to targeted ERP product record line item
    @Column({ name: 'productId', type: 'int', nullable: true })
    productId!: number | null;

    @ManyToOne(() => Product, { onDelete: 'NO ACTION', nullable: true })
    @JoinColumn({ name: "productId" })
    product!: Product | null;

    @Column({ name: 'categoryId', type: 'int', nullable: true })
    categoryId!: number | null;

    @ManyToOne(() => ProductCategory, { onDelete: 'NO ACTION', nullable: true })
    @JoinColumn({ name: "categoryId" })
    productCategory!: ProductCategory | null;

    @Column({ type: 'datetime', nullable: true })
    validFrom!: Date | null;

    @Column({ type: 'datetime', nullable: true })
    validTo!: Date | null;

    @Column({ type: 'bit', default: true })
    isActive!: boolean;

    @Column({ nullable: true })
    createdByUserId!: number;
}
