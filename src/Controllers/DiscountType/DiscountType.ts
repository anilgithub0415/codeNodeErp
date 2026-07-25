/*
This is for storing options like 
Percentage/ Fixed_Amount while declaring discount offers on product etc
*/
import { Router, Request, Response } from 'express';
import { getDiscountTypeRepository } from '../../dependencies'; // Ensure this loader is registered

interface CreateTypeRequestBody {
    tenantId: number;
    typeName: string;
    description?: string;
}

const router = Router();

router.use((req, res, next) => {
    try {
        getDiscountTypeRepository(); 
        next();
    } catch (error: any) {
        res.status(500).json({ message: 'Server initialization error. DiscountType engine not ready.' });
    }
}); 

router.route('/:tenantId/:id').get(async (req: Request, res: Response) => {
    try {
        const tenantId = parseInt(req.params.tenantId, 10);        
        const typeId = parseInt(req.params.id, 10);
        const service = getDiscountTypeRepository(); 
        
        const discountType = await service.getDiscountType(tenantId, typeId);
        return res.status(200).json(discountType);
    } catch (error: any) {
        return res.status(500).json({ "message": "Failed to retrieve category: " + error.message });
    }
});

router.route('/:tenantId').get(async (req: Request, res: Response) => {
    try {
        const service = getDiscountTypeRepository(); 
        const tenantId = parseInt(req.params.tenantId, 10);
        
        const types = await service.getDiscountTypes(tenantId);
        return res.status(200).json(types);
    } catch (error: any) {
        return res.status(500).json({ "message": "Failed to list options: " + error.message });
    }
});

router.route('').post(async (req: Request<{}, {}, CreateTypeRequestBody>, res: Response) => {
    try {
        const service = getDiscountTypeRepository();

        if (!req.body.typeName) {
           return res.status(400).json({ message: 'Discount Strategy Type identifier key string is required' });
        }

        const securePayload = {
            ...req.body,
            tenantId: req.user.tenantId,       
            createdByUserId: req.user.id        
        };

        const typeInstance = await service.createDiscountTypeClean(securePayload);
        return res.status(201).json(typeInstance);   
    } catch (error: any) {
        return res.status(400).json({ 'message': 'Creation processing error: ' + error.message }); 
    }
});

router.route('/:id').put(async (req: Request, res: Response) => {
    try {
        const service = getDiscountTypeRepository();
        const targetId = parseInt(req.params.id, 10);

        if (isNaN(targetId)) return res.status(400).json({ message: 'Invalid Identification format parameter.' });

        const loggedInTenantId = req.user.tenantId;
        const { id, tenantId, ...updatableFields } = req.body;

        const updatedType = await service.updateDiscountType(targetId, loggedInTenantId, updatableFields);
        return res.status(200).json(updatedType); 
    } catch (error: any) {
        return res.status(400).json({ 'message': 'Update sequence fault out: ' + error.message });
    }
});

export default router;
