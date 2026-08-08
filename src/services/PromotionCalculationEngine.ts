export interface PromotionRequest {

    tenantId:number;

    customerId:number;

    productId:number;

    productVariantId?:number;

    quantity:number;

    sellingPrice:number;

    discountAmount:number;

    taxableAmount:number;

}

export interface PromotionResult {

    promotionAmount:number;

    appliedPromotionId:number|null;

    promotionCode?:string;

    promotionName?:string;

}

class PromotionCalculationEngine {

    async calculate(
        request:PromotionRequest
    ):Promise<PromotionResult>{

        // V1
        // No promotions yet

        return{

            promotionAmount:0,

            appliedPromotionId:null,

            promotionCode:"",

            promotionName:""

        };

    }

}

export default PromotionCalculationEngine;