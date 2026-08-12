import { EntityManager, Like, Repository, Not } from 'typeorm';
import { Product } from '../entity/Product';
import { ProductCategory } from '../entity/ProductCategory';
import { AppDataSource } from '../../data-source'; 
import { ProductTemplate } from '../entity/product_template';
import { ProductVariant } from '../entity/productVariant';

interface CreateProductDto {
    id?: number;
    tenantId: number;
    prodName: string;
    description: string | null;
    sku: string | null;
    basePrice: number;
    categoryId?: number; 
    hsnId?: number;      
    createdByUserId?: number;
    [key: string]: any;
}

export interface CreatedProductResponse {
    product: Product;
}

export class ProductService {
    private productRepository!: Repository<Product>;

    async init(productRepo: Repository<Product>): Promise<void> {
        this.productRepository = productRepo;
        console.log("ProductService repository initialized.");       
    }

    async getProduct(ptenantId: number, pProdId: number, manager?: EntityManager): Promise<Product> {
        if (!this.productRepository) {
            throw new Error("ProductService repository not initialized. Call init() first.");
        }
        const productRepository = manager ? manager.getRepository(Product) : this.productRepository;
        
        // Defensive query strategy: Try loading with relations first, catch and fall back if mapping crashes
        try {
            const ps = await productRepository.findOne({
                where: { tenantId: ptenantId, id: pProdId },
                relations: ['hsnTaxRule', 'productCategory'] 
            }); 
            
            if (ps) return ps;
        } catch (relationError) {
            console.warn("Failed to eager load relations, falling back to base object query:", relationError);
        }

        // Fallback: Fetch clean base row record without forcing potentially missing relation constraints
        const baseProduct = await productRepository.findOne({
            where: { tenantId: ptenantId, id: pProdId }
        });

        if (!baseProduct) {
            throw new Error(`Product with ID ${pProdId} does not exist for tenant ${ptenantId}.`);
        }

        return baseProduct;
    }

    async getProductVariant(
    ptenantId: number,
    pVariantId: number,
    manager?: EntityManager
): Promise<ProductVariant> {

    if (!this.productRepository) {
        throw new Error(
            "ProductService repository not initialized. Call init() first."
        );
    }

    const variantRepository =
        manager
            ? manager.getRepository(ProductVariant)
            : AppDataSource.getRepository(ProductVariant);


    // ------------------------------------------------------------
    // Try loading variant with its parent template and relations
    // ------------------------------------------------------------

    try {

        const variant =
            await variantRepository.findOne({

                where: {
                    id: pVariantId,

                    productTemplate: {
                        tenantId: ptenantId
                    }

                },

                relations: [
                    'productTemplate',
                    'productTemplate.productCategory',
                    'productTemplate.hsnTaxRule'
                ]

            });


        if (variant) {
            return variant;
        }

    }
    catch (relationError) {

        console.warn(
            "Failed to eager load ProductVariant relations. Falling back to base query:",
            relationError
        );

    }


    // ------------------------------------------------------------
    // Fallback: load variant + parent template
    // ------------------------------------------------------------

    const baseVariant =
        await variantRepository.findOne({

            where: {
                id: pVariantId
            },

            relations: [
                'productTemplate'
            ]

        });


    if (!baseVariant) {

        throw new Error(
            `ProductVariant with ID ${pVariantId} does not exist.`
        );

    }


    // ------------------------------------------------------------
    // Tenant validation
    // ------------------------------------------------------------

    if (
        !baseVariant.productTemplate ||
        baseVariant.productTemplate.tenantId !== ptenantId
    ) {

        throw new Error(
            `ProductVariant with ID ${pVariantId} does not exist for tenant ${ptenantId}.`
        );

    }


    return baseVariant;
}

    async getProducts(ptenantId: number, manager?: EntityManager): Promise<Product[]> {
        if (!this.productRepository) {
            throw new Error("ProductService repository not initialized. Call init() first.");
        }
        const productRepository = manager ? manager.getRepository(Product) : this.productRepository;
        
        try {
            return await productRepository.find({
                where: { tenantId: ptenantId },
                relations: ['hsnTaxRule', 'productCategory'] 
            }); 
        } catch (relationError) {
            console.warn("Failed to find list with relations, loading base dataset:", relationError);
            return await productRepository.find({
                where: { tenantId: ptenantId }
            });
        }
    }

    async getProductSuggestions(tenantId: number, searchQuery: string): Promise<any[]> {
        if (!this.productRepository) {
            throw new Error("ProductService repository not initialized.");
        }
        return await this.productRepository.find({
            where: {
                tenantId: tenantId,
                prodName: Like(`%${searchQuery.trim()}%`)
            },
            select: {
                id: true,
                prodName: true,
                sku: true,
                isActive: true
            },
            take: 10 
        });
    }

    async createProduct(productData: Partial<CreateProductDto>): Promise<Product> {
        if (!this.productRepository) {
            throw new Error("ProductService repository not initialized.");
        }

        const trimmedName = productData.prodName?.trim();
        if (!trimmedName) throw new Error("Product name is required.");

        const duplicateMatch = await this.productRepository.findOne({
            where: {
                tenantId: productData.tenantId,
                prodName: trimmedName
            }
        });

        if (duplicateMatch) {
            if (duplicateMatch.isActive) {
                throw new Error(`VALIDATION: Active product matching '${trimmedName}' already exists.`);
            }
            throw new Error(`ARCHIVED_CONFLICT:${duplicateMatch.id}`);
        }

        const brandNewItem = this.productRepository.create({
            ...productData,
            prodName: trimmedName,
            isActive: true
        });

        return await this.productRepository.save(brandNewItem);
    }

    async updateProduct(productData: Partial<CreateProductDto>): Promise<Product> {
        if (!this.productRepository) {
            throw new Error("ProductService repository not initialized.");
        }

        const trimmedName = productData.prodName?.trim();
        if (!trimmedName) throw new Error("Product name is required.");
        if (!productData.id) throw new Error("Product ID is required for execution.");

        const duplicateMatch = await this.productRepository.findOne({
            where: {
                tenantId: productData.tenantId,
                prodName: trimmedName,
                id: Not(productData.id)
            }
        });

        if (duplicateMatch) {
            if (duplicateMatch.isActive) {
                throw new Error(`VALIDATION: Active product matching '${trimmedName}' already exists.`);
            }
            throw new Error(`ARCHIVED_CONFLICT:${duplicateMatch.id}`);
        }

        const existingItem = await this.productRepository.findOne({
            where: { id: productData.id, tenantId: productData.tenantId }
        });

        if (!existingItem) {
            throw new Error("Product target resource not found inside current workspace context.");
        }

        Object.assign(existingItem, {
            ...productData,
            prodName: trimmedName
        });

        return await this.productRepository.save(existingItem);
    }

    async reactivateProduct(tenantId: number, productId: number): Promise<Product> {
        if (!this.productRepository) {
            throw new Error("ProductService repository not initialized.");
        }

        const product = await this.productRepository.findOne({
            where: { id: productId, tenantId: tenantId }
        });

        if (!product) throw new Error("Target product not found matching current tenant workspace rules.");
        if (product.isActive) return product; 

        product.isActive = true;
        return await this.productRepository.save(product);
    }

    async deleteProduct(ptenantId: number, pProdId: number, manager?: EntityManager): Promise<void> {
        if (!this.productRepository) {
            throw new Error("ProductService repository not initialized. Call init() first.");
        }
        const productRepository = manager ? manager.getRepository(Product) : this.productRepository;
        const ps = await productRepository.findOne({
            where: { tenantId: ptenantId, id: pProdId }
        });

        if (!ps) {
            throw new Error("Product not found inside this company scope account.");
        }
        await productRepository.remove(ps);
    }
}
export default ProductService;
