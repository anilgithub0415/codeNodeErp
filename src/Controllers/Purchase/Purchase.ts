import { Router, Request, Response } from 'express';
import {getPurchaseOrderRepository} from '../../dependencies'
import { AppDataSource } from '../../../data-source';
import PurchaseService from '../../services/PurchaseService';

const router = Router();
// Middleware to ensure settingsService is available (optional, but good for clarity)
// Or rely on the fact that dependencies.ts ensures it at startup
router.use((req, res, next) => {
    
    try {
       const PurchaseService = getPurchaseOrderRepository(); // Attempt to get the service
      
        next();
    } catch (error: any) {
        console.error('PurchaseService not initialized when requested:', error.message);
        res.status(500).json({ message: 'Server initialization error. Purchase service not ready.' });
    }
}); 

router.route('')
    .post(async (req: Request, res: Response) => {
        try {
        
            const PurchaseService = getPurchaseOrderRepository(); 
                console.log('.........................................................usercontext body:',req.body);
            const purchaseOrder = await PurchaseService.createPurchaseOrder(req.body);

            res.status(201).json(purchaseOrder);
        } catch (error: any) {
            console.error('Purchase Order creation failed:', error.message || error);
            res.status(400).json({ 'message': 'Purchase Order creation failed: ' + error.message });
        }
    })

 
export default router;