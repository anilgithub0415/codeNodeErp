import PriceResolverEngine from "./PriceResolverEngine";
import DiscountCalculationEngine from "./DiscountCalculationEngine";
import PromotionCalculationEngine from "./PromotionCalculationEngine";
import CouponCalculationEngine from "./CouponCalculationEngine";
import FreightCalculationEngine from "./FreightCalculationEngine";
import AdjustmentCalculationEngine from "./AdjustmentCalculationEngine";
import TaxCalculationEngine from "./TaxCalculationEngine";
import RoundOffEngine from "./RoundOffEngine";
import TotalsEngine from "./TotalsEngine";

import {
    PricingRequest,
    PricingResponse,
    PricingLineResponse
} from "./PriceCalculationEngine";
class OrderPricingEngine {

    private priceResolverEngine = new PriceResolverEngine();
    private discountEngine = new DiscountCalculationEngine();
    private promotionEngine = new PromotionCalculationEngine();
    private couponEngine = new CouponCalculationEngine();
    private freightEngine = new FreightCalculationEngine();
    private adjustmentEngine = new AdjustmentCalculationEngine();
    private taxEngine = new TaxCalculationEngine();
    private roundOffEngine = new RoundOffEngine();
    private totalsEngine = new TotalsEngine();

}

export default OrderPricingEngine;