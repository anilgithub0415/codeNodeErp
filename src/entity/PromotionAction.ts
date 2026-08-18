import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Promotion } from './Promotion';

export enum PromotionActionType {
    DISCOUNT = "DISCOUNT",
    FREE_PRODUCT = "FREE_PRODUCT"
}
@Entity({ name: "PromotionAction" })
export class PromotionAction {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: "int" })
    promotionId!: number;

    @ManyToOne(
        () => Promotion,
        promotion => promotion.actions,
        { onDelete: "CASCADE" }
    )
    @JoinColumn({ name: "promotionId" })
    promotion!: Promotion;

    @Column({ type: "nvarchar", length: 30 })
    actionType!: PromotionActionType;

    @Column({ type: "int", nullable: true })
    discountTypeId!: number | null;

    @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
    discountValue!: number | null;

    @Column({ type: "nvarchar", length: 30, nullable: true })
    targetType!: string | null;

    @Column({ type: "int", nullable: true })
    targetProductId!: number | null;

    @Column({ type: "int", nullable: true })
    targetCategoryId!: number | null;

    @Column({ type: "int", default: 1 })
    sequence!: number;
}