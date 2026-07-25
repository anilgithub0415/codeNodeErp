// src/entity/ProductCategory.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index, OneToMany } from 'typeorm';
import { Tenant } from './Tenant';
import { HsnTaxRule } from './HsnTaxRule';
import { Product } from './Product';

@Entity({ name: 'ProductCategory' })
@Index(['tenantId', 'categoryName'], { unique: true }) // Prevents duplicate categories per tenant
export class ProductCategory {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'int' })
    tenantId!: number;
      
    @ManyToOne(() => Tenant, { onDelete: 'NO ACTION' })
    @JoinColumn({ name: "tenantId" })
    tenant!: Tenant;

    @Column({ name: 'category_name', type: 'nvarchar', length: 50 })
    categoryName!: string; 

    @Column({ name: 'description', type: 'nvarchar', length: 255, nullable: true })
    description!: string | null;

    @Column({ type: 'bit', default: true })
    isActive!: boolean;

    // 🌟 HELPER SHORTCUT: Pre-populates the HSN field when creating a product under this category
    @Column({ type: 'int', nullable: true })
    defaultHsnId!: number | null;

    @ManyToOne(() => HsnTaxRule, { onDelete: 'NO ACTION' })
    @JoinColumn({ name: "defaultHsnId" })
    defaultHsnTaxRule!: HsnTaxRule | null;

    // Inverse side relationship back to products
    @OneToMany(() => Product, (product) => product.productCategory)
    products!: Product[];
}
