export interface AdjustmentRequest {

    tenantId:number;

    customerId:number;

    orderAmount:number;

    adjustmentReason?:string;

}

export interface AdjustmentCalculationResult{

    netAdjustment:number;

    adjustmentId?:number|null;

    adjustmentName?:string;

}

class AdjustmentCalculationEngine {

    async calculate(
        request:AdjustmentRequest
    ):Promise<AdjustmentCalculationResult>{

        // Future:
        // Round Off
        // Manual Discount
        // Manual Charges
        // Packing Charges
        // Credit Note Adjustment
        // Previous Balance Adjustment
        // Cash Discount
        // Tenant Hook

        return{

            netAdjustment:0,

            adjustmentId:null,

            adjustmentName:""

        };

    }

}

export default AdjustmentCalculationEngine;