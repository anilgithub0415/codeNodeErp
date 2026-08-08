export interface TotalsRequest {

    subTotal:number;

    discount:number;

    promotion:number;

    coupon:number;

    freight:number;

    adjustment:number;

    taxableAmount:number;

    taxAmount:number;

    roundOff:number;

}

export interface TotalsCalculationResult {

    subTotal:number;

    totalDiscount:number;

    taxableAmount:number;

    taxAmount:number;

    grandTotal:number;

}

class TotalsEngine {

    async calculate(
        request:TotalsRequest
    ):Promise<TotalsCalculationResult>{

        const totalDiscount =
            Number(
                (
                    request.discount +
                    request.promotion +
                    request.coupon
                ).toFixed(2)
            );

        const grandTotal =
            Number(
                (
                    request.taxableAmount +
                    request.taxAmount +
                    request.roundOff
                ).toFixed(2)
            );

        return{

            subTotal:request.subTotal,

            totalDiscount,

            taxableAmount:request.taxableAmount,

            taxAmount:request.taxAmount,

            grandTotal

        };

    }

}

export default TotalsEngine;