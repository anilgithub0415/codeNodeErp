export interface TaxRequest {

    tenantId: number;

    productId: number;

    productVariantId?: number;

    taxableAmount: number;

    gstPercentage: number;

}

export interface TaxResult {

    gstPercentage: number;

    gstAmount: number;

    cgstAmount?: number;

    sgstAmount?: number;

    igstAmount?: number;

    totalAmount: number;

}

class TaxCalculationEngine {

    async calculate(
        request: TaxRequest
    ): Promise<TaxResult> {

        // V1
        // GST Exclusive
        // Future:
        // - Read HSN
        // - Read Tenant Tax Strategy
        // - Inclusive Pricing
        // - IGST / CGST / SGST

        const gstAmount = Number(
            (
                request.taxableAmount *
                request.gstPercentage /
                100
            ).toFixed(2)
        );

        return {

            gstPercentage: request.gstPercentage,

            gstAmount,

            totalAmount: Number(
                (
                    request.taxableAmount +
                    gstAmount
                ).toFixed(2)
            )

        };

    }

}

export default TaxCalculationEngine;