import {getCustomerServiceRepository,  getProductRepository, getTenantStrategyServiceRepository} from '../dependencies'
import { HookBroker } from './execution/hook-broker';
import DiscountCalculationEngine from './DiscountCalculationEngine';
import PriceResolverEngine from './PriceResolverEngine';
import TaxCalculationEngine from './TaxCalculationEngine';
import PromotionCalculationEngine from './PromotionCalculationEngine';
import CouponCalculationEngine from './CouponCalculationEngine';


export enum PricingStrategyType {
    CATEGORY_BASED = "CATEGORY_BASED",                     
    PLAIN = "PLAIN",
    PRODUCT_VARIANT = "PRODUCT_VARIANT",
    CUSTOMER_SPECIFIC = "CUSTOMER_SPECIFIC"
}

export interface PricingRequest{

    tenantId:number;

    clientId:number;

      couponCode?: string;

      promotionCode?: string;

    orderDate?: Date;

    items:PricingLineRequest[];

}
export interface PricingLineRequest {

    productId: number;

    productVariantId?: number;

    quantity: number;

    gstPercentage: number;

    targetPrice?: number;

  

}

export interface PricingResponse{

    totalAmount:number;

    items:PricingLineResponse[];

}
export interface PricingLineResponse{

    productId:number;

    basePrice:number;

    finalPrice:number;

    appliedDiscount:number;

    appliedLineDiscountId:number|null;

    gstAmount:number;

    totalItemAmount:number;

}
export interface PricingResult {

    basePrice:number;

    sellingPrice:number; //our finalPrice

    discount:number;

    appliedDiscountId?:number|null;

    gstPercentage:number;

    gstAmount:number;

    taxableAmount:number;

    totalAmount:number;

}



class PriceCalculationEngine{
    private hookBroker =new HookBroker();         
    private discountEngine =    new DiscountCalculationEngine();
    private taxCalculationEngine =   new TaxCalculationEngine();
    private promotionEngine =  new PromotionCalculationEngine();
    private couponEngine =    new CouponCalculationEngine();

          async calculateLinePrice(
            tenantId: number,
            customerId: number,
            request: PricingLineRequest,
            couponCode?: string
         ): Promise<PricingResult> {

            //1. ---------------------------------------------------------------------------------------------------
                        const priceResolver = new PriceResolverEngine();

                        const priceResult =  await priceResolver.resolve({

                                tenantId,

                                customerId,

                                productId:request.productId,

                                productVariantId:request.productVariantId,

                                quantity:request.quantity

                            });
                        const sellingPrice =   priceResult.sellingPrice;

                        const basePrice =   priceResult.basePrice;    

                        const discountResult =await this.discountEngine.calculate({

                            tenantId, customerId, productId: request.productId,  productVariantId: request.productVariantId,
                            quantity: request.quantity,   sellingPrice

                        });


                  //2. ---------------------------------------------------------------------------------------------------
                             
                        //Promotions
                      let taxableAmount =
                                Number(
                                    (
                                        sellingPrice *
                                        request.quantity -
                                        discountResult.discount
                                    ).toFixed(2)
                                );

                            const promotionResult =
                                await this.promotionEngine.calculate({

                                    tenantId,

                                    customerId,

                                    productId:request.productId,

                                    productVariantId:request.productVariantId,

                                    quantity:request.quantity,

                                    sellingPrice,

                                    discountAmount:discountResult.discount,

                                    taxableAmount

                                });
                                
                            taxableAmount =
                                Number(
                                    (
                                        taxableAmount -
                                        promotionResult.promotionAmount
                                    ).toFixed(2)
                                );                    

            //3. ---------------------------------------------------------------------------------------------------
                       const couponResult =
                            await this.couponEngine.calculate({

                                tenantId,

                                customerId,

                                couponCode,

                                productId: request.productId,

                                productVariantId: request.productVariantId,

                                quantity: request.quantity,

                                sellingPrice,

                                discountAmount: discountResult.discount,

                                promotionAmount: promotionResult.promotionAmount,

                                taxableAmount

                            });

                        taxableAmount = Number(
                            (
                                taxableAmount -
                                couponResult.couponAmount
                            ).toFixed(2)
                        );
            //-------------------------------------------------------------------------------------------------------
                        const taxResult =
                            await this.taxCalculationEngine.calculate({

                                tenantId,

                                productId: request.productId,

                                productVariantId: request.productVariantId,

                                taxableAmount,

                                gstPercentage: request.gstPercentage

                            });

                        return {

                            basePrice,

                            sellingPrice,

                            discount: discountResult.discount,

                            appliedDiscountId:  discountResult.appliedDiscountId,

                            gstPercentage:  request.gstPercentage,

                            gstAmount:taxResult.gstAmount,

                            taxableAmount,

                            totalAmount: taxResult.totalAmount
                            
                                

                        };

        }

   
        
      
      
      private async resolveSellingPrice(
        tenantId: number,
        customerId: number,
        request: PricingLineRequest
      ): Promise<number> 
            {

            const tenantStrategyService = getTenantStrategyServiceRepository();
            const customerService = getCustomerServiceRepository();

            const strategies = await tenantStrategyService.getTenantStrategies(tenantId);

            const pricingStrategy = strategies.find(
                s => s.tenantStrategyName === "Pricing_Strategy"
            );

            if (!pricingStrategy) {
                throw new Error("Pricing Strategy not configured.");
            }

            if (pricingStrategy.tenantStrategy === PricingStrategyType.CATEGORY_BASED) {

                const customer = await customerService.getCustomerById(
                    tenantId,
                    customerId
                );

                if (!customer) {
                    throw new Error("Customer not found.");
                }
  const productRepository = getProductRepository();

                const product = await productRepository.getProduct(
                    tenantId,
                    request.productId
                );
                

                if (!product) {
                    throw new Error("Product not found.");
                }

           const hookPayload = {
    tenantId,
    customerId,

    product,

    quantity: request.quantity,

    customerCategory: customer.customerCategoryId
};

console.log('hookpayload',hookPayload);

                const pricing =
                    await this.hookBroker.executeHook(
                        "A_Product_Pricing_Rule",
                        tenantId,
                        hookPayload
                    );
console.log('returned pricing :',pricing);

                return Number(pricing.product.finalPrice);//sellingPrice
            }

            if (pricingStrategy.tenantStrategy === PricingStrategyType.PLAIN) {

                const productRepository = getProductRepository();

                const product = await productRepository.getProduct(
                    tenantId,
                    request.productId
                );

                if (!product) {
                    throw new Error("Product not found.");
                }

                return Number(product.basePrice);
            }

                if (
                    pricingStrategy.tenantStrategy === PricingStrategyType.PRODUCT_VARIANT
                    ) {
                    throw new Error("PRODUCT_VARIANT strategy not implemented.");
                }
                if (
                    pricingStrategy.tenantStrategy ===  PricingStrategyType.CUSTOMER_SPECIFIC
                    ) {
                        throw new Error("CUSTOMER_SPECIFIC strategy not implemented.");
                    }


            throw new Error(
                `Unsupported Pricing Strategy: ${pricingStrategy.tenantStrategy}`
            );
    } 

            
        
       

        
        

    

}

export default PriceCalculationEngine