export interface RoundOffRequest {

    tenantId:number;

    amount:number;

}

export interface RoundOffCalculationResult {

    roundOffAmount:number;

    finalAmount:number;

}

class RoundOffEngine {

    async calculate(
        request:RoundOffRequest
    ):Promise<RoundOffCalculationResult>{

        // Future Strategies:
        // ROUND_NEAREST_1
        // ROUND_NEAREST_0_50
        // ROUND_NEAREST_0_05
        // ALWAYS_UP
        // ALWAYS_DOWN
        // NO_ROUNDING
        // Tenant Hook

        const finalAmount =
            Math.round(request.amount);

        const roundOffAmount =
            Number(
                (
                    finalAmount -
                    request.amount
                ).toFixed(2)
            );

        return{

            roundOffAmount,

            finalAmount

        };

    }

}

export default RoundOffEngine;