import { Router, Request, Response } from 'express';
import { getProductRepository, getProductTemplateRepository } from '../../dependencies'
import PriceCalculationService from '../../services/PriceCalculationEngine';
import { AppDataSource } from '../../../data-source';

interface CreateProductRequestBody {
    tenantId: number,
    prodName: string,
    description: string,
    sku: string,
    basePrice: number
}

const router = Router();

router.use((req, res, next) => {
    try {
        const productService = getProductRepository(); 
        next();
    } catch (error: any) {
        console.error('ProductService not initialized when requested:', error.message);
        res.status(500).json({ message: 'Server initialization error. Product service not ready.' });
    }
}); 

// ==========================================
// 1. STATIC AND SINGLE-PARAMETER ROUTES FIRST
// ==========================================

// --- Route: /product
router.route('')
    .post(async (req: Request<{}, {}, CreateProductRequestBody>, res: Response) => {
        try {
            const productService = getProductRepository();
            if (!req.body.prodName || !req.body.basePrice) {
               console.log('Basic validation fail: product name or base_price missing');
               return res.status(400).json({ message: 'Product name and base price are required.' });
            }

            const loggedInTenantId = req.user.tenantId; 
            const loggedInUserId = req.user.id; 

            const secureProductPayload = {
                ...req.body,
                tenantId: loggedInTenantId,       
                createdByUserId: loggedInUserId    
            };

            console.log('Sanitised Payload Context Body:', secureProductPayload);

            const product = await productService.createProduct(secureProductPayload);
            return res.status(201).json(product);
        } catch (error: any) {
            console.error('Product creation failed:', error.message || error);
            return res.status(400).json({ 'message': 'Product creation failed: ' + error.message });
        }
    })
    .put(async (req: Request, res: Response) => {
        try {
            const productService = getProductRepository();
            if (!req.body.id || !req.body.prodName || !req.body.basePrice) {
               return res.status(400).json({ message: 'Product ID, name, and base price are required for updates.' });
            }

            const loggedInTenantId = req.user.tenantId; 

            const secureProductPayload = {
                ...req.body,
                tenantId: loggedInTenantId
            };

            console.log('Sanitised PUT Payload Body:', secureProductPayload);

            const updatedProduct = await productService.updateProduct(secureProductPayload);
            return res.status(200).json(updatedProduct);
        } catch (error: any) {
            console.error('Product update failed:', error.message || error);
            return res.status(400).json({ 'message': 'Product update failed: ' + error.message });
        }
    });

// --- Route: /product/withvariant
router.route('/withvariant')
    .post(async (req: Request<{}, {}, CreateProductRequestBody>, res: Response) => {
        try {
            const productTempService = getProductTemplateRepository(); 
            if (!req.body.prodName || !req.body.basePrice) {
               console.log('Basic validation fail like product name, base_price missing');
            }

            console.log('posting withvariant body:', req.body);
            const product = await productTempService.createProductTemplate(req.body);
            return res.status(201).json(product);
        } catch (error: any) {
            console.error('User creation failed:', error.message || error);
            return res.status(400).json({ 'message': 'User creation failed: ' + error.message });
        }
    });

// --- Route: /product/suggestions/:tenantId
router.route('/suggestions/:tenantId').get(async (req: Request, res: Response) => {
    try {
        const tenantId = parseInt(req.params.tenantId);
        const searchQuery = req.query.q as string || '';

        const productService = getProductRepository();
        const suggestions = await productService.getProductSuggestions(tenantId, searchQuery);
 
        return res.status(200).json(suggestions);
    } catch (error: any) {
        console.error('Failed to run typeahead suggestions:', error.message);
        return res.status(500).json({ message: 'Error retrieving dynamic suggestions catalog list.' });
    }
});

// --- Route: /product/reactivate/:tenantId/:id
router.route('/reactivate/:tenantId/:id').post(async (req: Request, res: Response) => {
    try {
        const tenantId = parseInt(req.params.tenantId);
        const productId = parseInt(req.params.id);

        const productService = getProductRepository();
        const restoredRecord = await productService.reactivateProduct(tenantId, productId);

        return res.status(200).json(restoredRecord);
    } catch (error: any) {
        console.error('Reactivation routine operational crash:', error.message);
        return res.status(400).json({ message: error.message });
    }
});

// --- Route: /product/withvariant/:tenantId
router.route('/withvariant/:tenantId')
    .get(async (req: Request, res: Response) => {
        try {
            const productTempService = getProductTemplateRepository(); 
            const tenantId = parseInt(req.params.tenantId);
            const products = await productTempService.getProductTemplates(tenantId!);
            return res.status(200).json(products);
        } catch (error: any) {
            console.error('Failed to retrieve products:', error.message || error);
            return res.status(500).json({ "message": "Failed to retrieve products: " + error.message });
        }
    });

// --- Route: /product/finalPrice/:id/:tenantId/:custId
router.route('/finalPrice/:id/:tenantId/:custId')
    .post(async (req: Request, res: Response) => {
        try {
            const p = req.body;
            console.log('i got p:', p);
            
            const prodId = parseInt(req.params.id);
            const tenantId = parseInt(req.params.tenantId);
            const custId = parseInt(req.params.custId);

            const priceCalcService = new PriceCalculationService(); 
            const finalPrice = (await priceCalcService.calculateLinePrice(tenantId,  custId, p)).sellingPrice

            return res.status(200).json(finalPrice);
        } catch (error: any) {
            console.error('Failed to calculatefinalprice of product:', error.message || error);
            return res.status(500).json({ "message": "Failed to calculatefinalprice of product: " + error.message });
        }
    });

// --- Route: /product/:tenantId  <--- THIS MUST SIT ABOVE /:tenantId/:id
router.route('/:tenantId')
    .get(async (req: Request, res: Response) => {
        try {
            const productService = getProductRepository(); 
            const tenantId = parseInt(req.params.tenantId);
            const products = await productService.getProducts(tenantId!);
            return res.status(200).json(products);
        } catch (error: any) {
            console.error('Failed to retrieve products:', error.message || error);
            return res.status(500).json({ "message": "Failed to retrieve products: " + error.message });
        }
    });


// ==========================================
// 2. DOUBLE PARAMETER/CATCH-ALL ROUTES LAST
// ==========================================

// --- Route: /product/:tenantId/:id
router.route('/:tenantId/:id')
    .get(async (req: Request, res: Response) => {
        try {
            const tenantId = parseInt(req.params.tenantId);        
            const prodId = parseInt(req.params.id);
            
            // Defend against corrupted string mappings falling through
            if (isNaN(tenantId) || isNaN(prodId)) {
                return res.status(400).json({ message: "Invalid parameters supplied." });
            }

            const productService = getProductRepository(); 
            console.log('hitting get product with id:', prodId);
        
            const aProduct = await productService.getProduct(tenantId, prodId);
            return res.status(200).json(aProduct);
        } catch (error: any) {
            console.error('Failed to retrieve a product:', error.message || error);
            return res.status(500).json({ "message": "Failed to retrieve a product: " + error.message });
        }
    })
    .delete(async (req: Request, res: Response) => {
        try {
            const tenantId = parseInt(req.params.tenantId);
            const prodId = parseInt(req.params.id);
            const productService = getProductRepository();

            console.log(`Attempting to delete product id: ${prodId} under tenant: ${tenantId}`);

            await productService.deleteProduct(tenantId, prodId);
            return res.status(200).json({ message: "Product successfully deleted." });
        } catch (error: any) { 
            if (error.number === 547 || error.message?.includes('REFERENCE constraint')) {
                console.log('returning 409');
                return res.status(409).json({ 
                    message: "Cannot delete this product. It is linked to existing transactions like Purchase Orders or Inventory records." 
                });
            }

            console.error('Failed to delete product:', error.message || error);
            return res.status(500).json({ message: "Internal server error: " + error.message });
        }
    });

export default router;
