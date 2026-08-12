import {
    getCustomerServiceRepository,
    getProductRepository,
    getTenantStrategyServiceRepository
} from "../dependencies";

import { HookBroker } from "./execution/hook-broker";
import { PricingResult } from "./PriceCalculationEngine";

export enum PricingStrategyType {

    CATEGORY_BASED = "CATEGORY_BASED",

    PLAIN = "PLAIN",

    PRODUCT_VARIANT = "PRODUCT_VARIANT",

    CUSTOMER_SPECIFIC = "CUSTOMER_SPECIFIC"

}
export enum ProductFlatOrVariantType {
    FLAT = "FLAT",
    VARIANT = "VARIANT"
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
    request: PriceResolveRequest
): Promise<PricingResult> {

    console.log(request);
    
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


    // ============================================================
    // 1. PRODUCT MODE STRATEGY
    // ============================================================

    const productModeStrategy =
        strategies.find(
            s =>
                s.tenantStrategyName ===
                "Product_FlatOrVariant"
        );

    if (!productModeStrategy) {

        throw new Error(
            "Product Flat/Variant strategy not configured."
        );

    }


    // ============================================================
    // 2. PRICING STRATEGY
    // ============================================================

    const pricingStrategy =
        strategies.find(
            s =>
                s.tenantStrategyName ===
                "Pricing_Strategy"
        );

    if (!pricingStrategy) {

        throw new Error(
            "Pricing Strategy not configured."
        );

    }


    // ============================================================
    // 3. FLAT PRODUCT
    // ============================================================

    if (
        productModeStrategy.tenantStrategy ===
        ProductFlatOrVariantType.FLAT
    ) {

        if (!request.productId) {

            throw new Error(
                "Product ID is required for FLAT product strategy."
            );

        }

        const product =
            await productRepository.getProduct(
                request.tenantId,
                request.productId
            );

        if (!product) {

            throw new Error(
                "Product not found."
            );

        }


        // --------------------------------------------------------
        // FLAT + CATEGORY BASED
        // --------------------------------------------------------

        if (
            pricingStrategy.tenantStrategy ===
            PricingStrategyType.CATEGORY_BASED
        ) {

            const customer =
                await customerService.getCustomerById(
                    request.tenantId,
                    request.customerId
                );

            if (!customer) {

                throw new Error(
                    "Customer not found."
                );

            }

            const hookPayload = {

                tenantId:
                    request.tenantId,

                customerId:
                    request.customerId,

                product,

                quantity:
                    request.quantity,

                customerCategory:
                    customer.customerCategoryId

            };


            const pricing =
                await this.hookBroker.executeHook(

                    "A_Product_Pricing_Rule",

                    request.tenantId,

                    hookPayload

                );


            return {

                basePrice:
                    Number(product.basePrice),

                sellingPrice:
                    Number(
                        pricing.product.customPrice
                    ),
                gstAmount:0,
                gstPercentage:0,
                taxableAmount:0,
                totalAmount:0,discount:0    

            };

        }


        // --------------------------------------------------------
        // FLAT + PLAIN
        // --------------------------------------------------------

        if (
            pricingStrategy.tenantStrategy ===
            PricingStrategyType.PLAIN
        ) {

            return {

                basePrice:
                    Number(product.basePrice),

                sellingPrice:
                    Number(product.basePrice)
                    ,
                gstAmount:0,
                gstPercentage:0,
                taxableAmount:0,
                totalAmount:0,discount:0

            };

        }


        // --------------------------------------------------------
        // FLAT + CUSTOMER SPECIFIC
        // --------------------------------------------------------

        if (
            pricingStrategy.tenantStrategy ===
            PricingStrategyType.CUSTOMER_SPECIFIC
        ) {

            throw new Error(
                "CUSTOMER_SPECIFIC pricing for FLAT products not implemented."
            );

        }


        // --------------------------------------------------------
        // FLAT + PRODUCT VARIANT PRICING
        // --------------------------------------------------------

        if (
            pricingStrategy.tenantStrategy ===
            PricingStrategyType.PRODUCT_VARIANT
        ) {

            throw new Error(
                "PRODUCT_VARIANT pricing requires VARIANT product mode."
            );

        }

    }


    // ============================================================
    // 4. PRODUCT VARIANT
    // ============================================================

    if (
        productModeStrategy.tenantStrategy ===
        ProductFlatOrVariantType.VARIANT
    ) {

        if (!request.productVariantId) {

            throw new Error(
                "Product Variant ID is required for VARIANT product strategy."
            );

        }

        if (!request.productId) {

            throw new Error(
                "Product ID is required for VARIANT product strategy."
            );

        }


        // --------------------------------------------------------
        // Load parent product
        // --------------------------------------------------------

        const product =
            await productRepository.getProduct(
                request.tenantId,
                request.productId
            );

        if (!product) {

            throw new Error(
                "Parent product not found."
            );

        }


        // --------------------------------------------------------
        // Load variant
        // --------------------------------------------------------

        const productVariant =
            await productRepository.getProductVariant(
                request.tenantId,
                request.productVariantId
            );

        if (!productVariant) {

            throw new Error(
                "Product variant not found."
            );

        }


        // --------------------------------------------------------
        // Validate variant belongs to product
        // --------------------------------------------------------

        if (
            productVariant.productTemplateId !==
            request.productId
        ) {

            throw new Error(
                "Product variant does not belong to the specified product."
            );

        }


        // --------------------------------------------------------
        // PRODUCT VARIANT + PLAIN
        // --------------------------------------------------------

        if (
            pricingStrategy.tenantStrategy ===
            PricingStrategyType.PLAIN
        ) {

            return {

                basePrice:
                    Number(productVariant.basePrice),

                sellingPrice:
                    Number(productVariant.basePrice),
                gstAmount:0,
                gstPercentage:0,
                taxableAmount:0,
                totalAmount:0,discount:0

            };

        }


        // --------------------------------------------------------
        // PRODUCT VARIANT + CATEGORY BASED
        // --------------------------------------------------------

        if (
            pricingStrategy.tenantStrategy ===
            PricingStrategyType.CATEGORY_BASED
        ) {

            const customer =
                await customerService.getCustomerById(
                    request.tenantId,
                    request.customerId
                );

            if (!customer) {

                throw new Error(
                    "Customer not found."
                );

            }


            const hookPayload = {

                tenantId:
                    request.tenantId,

                customerId:
                    request.customerId,

                product,

                productVariant,

                quantity:
                    request.quantity,

                customerCategory:
                    customer.customerCategoryId

            };


            const pricing =
                await this.hookBroker.executeHook(

                    "A_Product_Pricing_Rule",

                    request.tenantId,

                    hookPayload

                );


            return {

                basePrice:
                    Number(productVariant.basePrice),

                sellingPrice:
                    Number(
                        pricing.product.customPrice
                    ),
                gstAmount:0,
                gstPercentage:0,
                taxableAmount:0,
                totalAmount:0,discount:0

            };

        }


        // --------------------------------------------------------
        // PRODUCT VARIANT + CUSTOMER SPECIFIC
        // --------------------------------------------------------

        if (
            pricingStrategy.tenantStrategy ===
            PricingStrategyType.CUSTOMER_SPECIFIC
        ) {

            throw new Error(
                "CUSTOMER_SPECIFIC pricing for VARIANT products not implemented."
            );

        }


        // --------------------------------------------------------
        // PRODUCT VARIANT + PRODUCT VARIANT
        // --------------------------------------------------------

        if (
            pricingStrategy.tenantStrategy ===
            PricingStrategyType.PRODUCT_VARIANT
        ) {

            return {

                basePrice:
                    Number(productVariant.basePrice),

                sellingPrice:
                    Number(productVariant.basePrice),
                gstAmount:0,
                gstPercentage:0,
                taxableAmount:0,
                totalAmount:0,discount:0

            };

        }

    }


    // ============================================================
    // 5. UNKNOWN PRODUCT MODE
    // ============================================================

    throw new Error(
        `Unsupported Product_FlatOrVariant strategy: ${productModeStrategy.tenantStrategy}`
    );

}

}

export default PriceResolverEngine;