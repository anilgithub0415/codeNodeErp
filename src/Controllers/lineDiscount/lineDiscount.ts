// src/module/promotionMgt/lineDiscountRouter.ts
import { Router, Request, Response } from 'express';
import { getLineDiscountRepository } from '../../dependencies'; // Make sure to add this dependency loader



interface CreateDiscountRequestBody {
    tenantId: number;
    discountCode: string;
    discountTypeId: number;
    discountValue: number;
    productId: number; // 💡 Changed from optional to mandatory to align with DTO rules
    categoryId?: number;
}

const router = Router();

// Middleware to ensure LineDiscountService is initialized
router.use((req, res, next) => {
    try {
        getLineDiscountRepository(); 
        next();
    } catch (error: any) {
        console.error('LineDiscountService not initialized when requested:', error.message);
        res.status(500).json({ message: 'Server initialization error. Discount management engine not ready.' });
    }
}); 

// ==========================================
// GET: RETRIEVE A SPECIFIC LINE DISCOUNT
// ==========================================
router.route('/:tenantId/:id').get(async (req: Request, res: Response) => {
    try {
        const tenantId = parseInt(req.params.tenantId, 10);        
        const discountId = parseInt(req.params.id, 10);
        const discountService = getLineDiscountRepository(); 
        
        const discount = await discountService.getDiscount(tenantId, discountId);
        return res.status(200).json(discount);
    } catch (error: any) {
        console.error('Failed to retrieve line discount:', error.message || error);
        return res.status(500).json({ "message": "Failed to retrieve line discount: " + error.message });
    }
});

// ==========================================
// GET: LIST ALL LINE DISCOUNTS UNDER A TENANT
// ==========================================
router.route('/:tenantId').get(async (req: Request, res: Response) => {
    try {
        const discountService = getLineDiscountRepository(); 
        const tenantId = parseInt(req.params.tenantId, 10);
        
        const discounts = await discountService.getDiscounts(tenantId);
        return res.status(200).json(discounts);
    } catch (error: any) {
        console.error('Failed to retrieve line discounts:', error.message || error);
        return res.status(500).json({ "message": "Failed to retrieve line discounts: " + error.message });
    }
});

// ==========================================
// POST: REGISTER A NEW LINE DISCOUNT
// ==========================================

router.route('').post(async (req: Request<{}, {}, CreateDiscountRequestBody>, res: Response) => {
    try {
        console.log('....................posting new disount:',req.body);
        
        const discountService = getLineDiscountRepository();

        if (!req.body.discountCode) {
           return res.status(400).json({ message: 'Discount code marker label is required' });
        }

        // 💡 Fail early if the mandatory product linkage is missing from the payload
        if (req.body.productId === undefined || req.body.productId === null) {
            return res.status(400).json({ message: 'Product identification link is required for line discounts' });
        }


        const secureDiscountPayload = {
            ...req.body,
            productId: Number(req.body.productId), // Ensure cast type matches number boundary
            tenantId: req.user.tenantId,       // Lock data namespace context 
            createdByUserId: req.user.id        // Audit log identification stamp
        };

        const discount = await discountService.createDiscountClean(secureDiscountPayload);
        return res.status(201).json(discount);    // ✅ 201 Created Status
    } catch (error: any) {
        console.error('Line discount creation failed:', error.message || error);
        return res.status(400).json({ 'message': 'Line discount creation failed: ' + error.message }); 
    }
});




// ==========================================
// PUT: MODIFY AN EXISTING LINE DISCOUNT
// ==========================================
router.route('/:id').put(async (req: Request, res: Response) => {
    try {
        const discountService = getLineDiscountRepository();
        const targetDiscountId = parseInt(req.params.id, 10);

        if (isNaN(targetDiscountId)) {
            return res.status(400).json({ message: 'Invalid Discount identification ID path format parameter.' });
        }

        const loggedInTenantId = req.user.tenantId;
        const { id, tenantId, ...updatableFields } = req.body;

        // Ensure productId is typed safely if passed down in updates
        if (updatableFields.productId !== undefined) {
            updatableFields.productId = Number(updatableFields.productId);
        }

        const updatedDiscount = await discountService.updateDiscount(
            targetDiscountId, 
            loggedInTenantId, 
            updatableFields
        );

        return res.status(200).json(updatedDiscount); // ✅ 200 OK Status
    } catch (error: any) {
        console.error('Line discount update failed:', error.message || error);
        return res.status(400).json({ 'message': 'Line discount update failed: ' + error.message });
    }
});

export default router;
