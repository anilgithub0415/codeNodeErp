import { getLineDiscountRepository } from "../dependencies";

export interface DiscountRequest {

    tenantId: number;

    customerId: number;

    productId: number;

    productVariantId?: number;

    quantity: number;

    sellingPrice: number;

}

export interface DiscountCalculationResult {

    discount: number;

    appliedDiscountId: number | null;

    discountCode?: string;

    discountName?: string;

}

class DiscountCalculationEngine {

    async calculate(
        request: DiscountRequest
    ): Promise<DiscountCalculationResult> {

        const lineDiscountService = getLineDiscountRepository();

        const lineDiscount =
            await lineDiscountService.findBestDiscount(

                request.tenantId,

                request.productId,

                request.productVariantId ?? null,

                request.customerId,

                request.quantity,

                request.sellingPrice

            );

        // -------------------------------------------------
        // Future Engines
        // Customer Contract
        // Category Discount
        // Promotion
        // Coupon
        // Loyalty
        // -------------------------------------------------

        if (!lineDiscount) {

            return {

                discount: 0,

                appliedDiscountId: null,

                discountCode: "",

                discountName: ""

            };

        }

        let discountAmount = 0;

        // Percentage Discount
        if (lineDiscount.discountType?.typeName === "PERCENTAGE") {

            discountAmount =
                request.sellingPrice *
                request.quantity *
                Number(lineDiscount.discountValue) / 100;

        }

        // Fixed Amount Discount
        else if (lineDiscount.discountType?.typeName === "FIXED_AMOUNT") {

            discountAmount =
                Number(lineDiscount.discountValue) *
                request.quantity;

        }

        return {

            discount: Number(discountAmount.toFixed(2)),

            appliedDiscountId: lineDiscount.id,

            discountCode: lineDiscount.discountCode,

            discountName: lineDiscount.description ?? ""

        };

    }

}

export default DiscountCalculationEngine;