import { Router, Request, Response } from 'express';
// Note: Assuming you add getDeliveryChallanRepository to your dependencies file
import { getDeliveryChallanRepository } from '../../dependencies'; 

const router = Router();

// Validation Middleware mirroring your base architecture
router.use((req, res, next) => {
    try {
        getDeliveryChallanRepository(); 
        next();
    } catch (error: any) {
        console.error('DeliveryChallanService not initialized:', error.message);
        res.status(500).json({ message: 'Server initialization error. Delivery Challan service not ready.' });
    }
}); 

router.route('/:tenantId')
    .get(async (req: Request, res: Response) => {
        try {
            const dcService = getDeliveryChallanRepository(); 
            var tenantId=parseInt(req.params.tenantId);
            
            if (isNaN(tenantId)) {
                return res.status(400).json({ message: "Missing or invalid activeTenantId parameter" });
            }

            const challans = await dcService.getChallans(tenantId);
            console.log('getChallans:',challans);
            
            res.status(200).json(challans);
        } catch (error: any) {
            console.error('Failed to retrieve Challans:', error.message || error);
            res.status(500).json({ message: "Failed to retrieve challans: " + error.message });
        }
    });

router.route('/')
    .post(async (req: Request, res: Response) => {
        try {
            const dcService = getDeliveryChallanRepository(); 
            console.log('Incoming Delivery Challan Payload:', req.body);
            
            const deliveryChallan = await dcService.createDeliveryChallan(req.body);
            res.status(201).json(deliveryChallan);
        } catch (error: any) {
            console.error('Delivery Challan creation failed:', error.message || error);
            res.status(400).json({ message: 'Delivery Challan creation failed: ' + error.message });
        }
    });

export default router;
