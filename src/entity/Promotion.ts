import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToMany,
    Index
} from 'typeorm';

/*
PromotionConditionType:
    ORDER_TOTAL
    PRODUCT_IN_CART
    PRODUCT_QUANTITY
    CATEGORY_IN_CART

PromotionConditionOperator:
    GREATER_THAN
    GREATER_THAN_OR_EQUAL
    EQUAL
    EXISTS

PromotionTargetType:
    ORDER
    PRODUCT
    CATEGORY

PromotionActionType:
    DISCOUNT
    FREE_PRODUCT
    
*/

import { PromotionCondition } from './PromotionCondition';
import { PromotionAction } from './PromotionAction';
 
@Entity({ name: "Promotion" })
@Index(["tenantId", "promotionCode"], { unique: true })
export class Promotion {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: "int" })
    tenantId!: number;

    @Column({ name: "promotionCode", type: "nvarchar", length: 50 })
    promotionCode!: string;

    @Column({ type: "nvarchar", length: 150 })
    name!: string;

    @Column({
        type: "nvarchar",
        length: 500,
        nullable: true
    })
    description!: string | null;

    @Column({
        type: "datetime",
        nullable: true
    })
    validFrom!: Date | null;

    @Column({
        type: "datetime",
        nullable: true
    })
    validTo!: Date | null;

    @Column({
        type: "bit",
        default: true
    })
    isActive!: boolean;

    @Column({
        type: "int",
        default: 1
    })
    priority!: number;

    @Column({
        type: "bit",
        default: false
    })
    stackable!: boolean;

    @Column({
        type: "int",
        default: 1
    })
    version!: number;

    @Column({
        type: "datetime",
        nullable: true
    })
    createdAt!: Date | null;

    @Column({
        type: "datetime",
        nullable: true
    })
    updatedAt!: Date | null;

    @OneToMany(
        () => PromotionCondition,
        condition => condition.promotion
    )
    conditions!: PromotionCondition[];

    @OneToMany(
        () => PromotionAction,
        action => action.promotion
    )
    actions!: PromotionAction[];
}