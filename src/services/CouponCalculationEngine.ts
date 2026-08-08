export interface CouponRequest {

    tenantId: number;

    customerId: number;

    couponCode?: string;

    productId: number;

    productVariantId?: number;

    quantity: number;

    sellingPrice: number;

    discountAmount: number;

    promotionAmount: number;

    taxableAmount: number;

}

export interface CouponResult {

    couponAmount: number;

    appliedCouponId: number | null;

    couponCode?: string;

    couponName?: string;

}

class CouponCalculationEngine {

    async calculate(
        request: CouponRequest
    ): Promise<CouponResult> {

        // V1
        // Coupon Engine not implemented

        return {

            couponAmount: 0,

            appliedCouponId: null,

            couponCode: "",

            couponName: ""

        };

    }

}

export default CouponCalculationEngine;
