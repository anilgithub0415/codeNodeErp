export interface FreightRequest {

    tenantId:number;

    customerId:number;

    deliveryAddressId?:number;

    pincode?:string;

    orderAmount:number;

    orderWeight?:number;

    totalQuantity:number;

    shippingMethod?:string;

}

export interface FreightCalculationResult{

    freight:number;

    freightRuleId?:number|null;

    freightRuleName?:string;

    isFreeShipping:boolean;

}

class FreightCalculationEngine {

    async calculate(
        request:FreightRequest
    ):Promise<FreightCalculationResult>{

        return{

            freight:0,

            freightRuleId:null,

            freightRuleName:"",

            isFreeShipping:false

        };

    }

}

export default FreightCalculationEngine;