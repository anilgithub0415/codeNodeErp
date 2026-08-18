import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Promotion } from './Promotion';

@Entity({ name: "PromotionCondition" })
export class PromotionCondition {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: "int" })
    promotionId!: number;

    @ManyToOne(
        () => Promotion,
        promotion => promotion.conditions,
        { onDelete: "CASCADE" }
    )
    @JoinColumn({ name: "promotionId" })
    promotion!: Promotion;

    @Column({ type: "nvarchar", length: 50 })
    conditionType!: string;

    @Column({ type: "nvarchar", length: 100, nullable: true })
    operator!: string | null;

    @Column({ type: "nvarchar", length: 500, nullable: true })
    value!: string | null;

    @Column({ type: "int", default: 0 })
    sequence!: number;
}