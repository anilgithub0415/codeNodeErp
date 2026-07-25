import { Router, Request, Response } from 'express';
import { getProductCategoryRepository } from '../../dependencies'; // Adjust import paths to match your layout

interface CreateCategoryRequestBody {
    tenantId: number; // For wholesale multitenancy scoping
    categoryName: string;
    description?: string | null;
    defaultHsnId?: number | null;
    isActive?: boolean;
}

const router = Router();

// Middleware to ensure productCategoryService is available at run-time
router.use((req, res, next) => {
    try {
        getProductCategoryRepository(); 
        next();
    } catch (error: any) {
        console.error('ProductCategoryService not initialized when requested:', error.message);
        res.status(500).json({ message: 'Server initialization error. ProductCategory service not ready.' });
    }
}); 

// Target specific category actions per tenant context
router.route('/:tenantId/:id')
    .get(async (req: Request, res: Response) => {
        try {
            const tenantId = parseInt(req.params.tenantId, 10);
            const id = parseInt(req.params.id, 10);        
            const categoryService = getProductCategoryRepository(); 
            
            const category = await categoryService.getCategory(tenantId, id);
            if (!category) {
                return res.status(404).json({ message: 'Category not found.' });
            }
            res.status(200).json(category);
        } catch (error: any) {
            console.error('Failed to retrieve product category:', error.message || error);
            res.status(500).json({ "message": "Failed to retrieve category: " + error.message });
        }
    })
    // 🌟 ADD THIS DELETE HANDLER HERE:
    .delete(async (req: Request, res: Response) => {
        try {
            const tenantId = parseInt(req.params.tenantId, 10);
            const id = parseInt(req.params.id, 10);        
            const categoryService = getProductCategoryRepository(); 

            console.log(`Attempting to delete product category id: ${id} under tenant: ${tenantId}`);

            // 1. Fire execution into the service layer
            await categoryService.deleteCategory(tenantId, id);
            
            return res.status(200).json({ message: "Category successfully deleted." });
        } catch (error: any) {    console.log('error number',error.number);            console.log('error :',error.message);            console.log('Boolean Error.message?.includesREFERENCE constraint:',error.message?.includes('REFERENCE constraint'));
            // 2. Intercept MS SQL Server constraint violation error (Error code 547)
            if (error.number === 547 || error.message?.includes('REFERENCE constraint')) {
                return res.status(409).json({ 
                    message: "Cannot delete this category. It is linked to active products in your catalog." 
                });
            }

            console.error('Failed to delete category:', error.message || error);
            return res.status(500).json({ message: "Internal server error: " + error.message });
        }
    });


// Target tenant-scoped collection actions
router.route('/:tenantId')
    .get(async (req: Request, res: Response) => {
        try {
            const tenantId = parseInt(req.params.tenantId, 10);
            const categoryService = getProductCategoryRepository(); 
            
            const categories = await categoryService.getCategories(tenantId);
            res.status(200).json(categories);
        } catch (error: any) {
            console.error('Failed to retrieve categories collection:', error.message || error);
            res.status(500).json({ "message": "Failed to retrieve categories: " + error.message });
        }
    })
    .post(async (req: Request<{ tenantId: string }, {}, CreateCategoryRequestBody>, res: Response) => {
        try {
            const tenantId = parseInt(req.params.tenantId, 10);
            const categoryService = getProductCategoryRepository();

            // Enforce basic request structural integrity validation checks
            if (!req.body.categoryName) {
               console.log('Basic category validation failure: categoryName missing');
               return res.status(400).json({ message: 'categoryName is a required field.' });
            }

            // Enforce routing path tenant configuration synchronization
            const payload = { ...req.body, tenantId };
            console.log('.........................................................productCategory body:', payload);

            const result = await categoryService.createCategory(payload);
            res.status(201).json(result);
        } catch (error: any) {
            console.error('Product category mutation operations failed:', error.message || error);
            res.status(400).json({ 'message': 'Category operation execution failed: ' + error.message });
        }
    });

export default router;
