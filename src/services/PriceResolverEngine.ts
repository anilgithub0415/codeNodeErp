import {
    getCustomerServiceRepository,
    getProductRepository,
    getTenantStrategyServiceRepository
} from "../dependencies";

import { HookBroker } from "./execution/hook-broker";

export enum PricingStrategyType {

    CATEGORY_BASED = "CATEGORY_BASED",

    PLAIN = "PLAIN",

    PRODUCT_VARIANT = "PRODUCT_VARIANT",

    CUSTOMER_SPECIFIC = "CUSTOMER_SPECIFIC"

}

export interface PriceResolveRequest {

    tenantId:number;

    customerId:number;

    productId:number;

    productVariantId?:number;

    quantity:number;

}

export interface PriceResolveResult {

    basePrice:number;

    sellingPrice:number;

}

class PriceResolverEngine {

    private hookBroker = new HookBroker();

    async resolve(
        request:PriceResolveRequest
    ):Promise<PriceResolveResult>{

        const tenantStrategyService =
            getTenantStrategyServiceRepository();

        const customerService =
            getCustomerServiceRepository();

        const productRepository =
            getProductRepository();

        const strategies =
            await tenantStrategyService.getTenantStrategies(
                request.tenantId
            );

        const pricingStrategy =
            strategies.find(
                s=>s.tenantStrategyName==="Pricing_Strategy"
            );

        if(!pricingStrategy){

            throw new Error(
                "Pricing Strategy not configured."
            );

        }

        //-------------------------------------------------
        // CATEGORY BASED
        //-------------------------------------------------

        if(pricingStrategy.tenantStrategy===PricingStrategyType.CATEGORY_BASED){

            const customer =
                await customerService.getCustomerById(
                    request.tenantId,
                    request.customerId
                );

            if(!customer){

                throw new Error("Customer not found.");

            }

            const product =
                await productRepository.getProduct(
                    request.tenantId,
                    request.productId
                );

            if(!product){

                throw new Error("Product not found.");

            }

            const hookPayload={

                tenantId:request.tenantId,

                customerId:request.customerId,

                product,

                quantity:request.quantity,

                customerCategory:
                    customer.customerCategoryId

            };

            const pricing =
                await this.hookBroker.executeHook(

                    "A_Product_Pricing_Rule",

                    request.tenantId,

                    hookPayload

                );

            return{

                basePrice:Number(product.basePrice),

                sellingPrice:Number(
                    pricing.product.finalPrice
                )

            };

        }

        //-------------------------------------------------
        // PLAIN
        //-------------------------------------------------

        if(pricingStrategy.tenantStrategy===PricingStrategyType.PLAIN){

            const product =
                await productRepository.getProduct(
                    request.tenantId,
                    request.productId
                );

            if(!product){

                throw new Error("Product not found.");

            }

            return{

                basePrice:Number(product.basePrice),

                sellingPrice:Number(product.basePrice)

            };

        }

        //-------------------------------------------------
        // PRODUCT VARIANT
        //-------------------------------------------------

        if(pricingStrategy.tenantStrategy===PricingStrategyType.PRODUCT_VARIANT){

            throw new Error(
                "PRODUCT_VARIANT strategy not implemented."
            );

        }

        //-------------------------------------------------
        // CUSTOMER SPECIFIC
        //-------------------------------------------------

        if(pricingStrategy.tenantStrategy===PricingStrategyType.CUSTOMER_SPECIFIC){

            throw new Error(
                "CUSTOMER_SPECIFIC strategy not implemented."
            );

        }

        throw new Error(
            `Unsupported Pricing Strategy ${pricingStrategy.tenantStrategy}`
        );

    }

}

export default PriceResolverEngine;