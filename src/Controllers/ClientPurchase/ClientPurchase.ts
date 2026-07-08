import { Router, Request, Response } from 'express';
import {getClientPurchaseOrderRepository} from '../../dependencies'
import { AppDataSource } from '../../../data-source';
import ClientPurchaseService from '../../services/ClientPurchaseService';

const router = Router();
// Middleware to ensure settingsService is available (optional, but good for clarity)
// Or rely on the fact that dependencies.ts ensures it at startup
router.use((req, res, next) => {
    
    try {
       const ClientPurchaseService = getClientPurchaseOrderRepository(); // Attempt to get the service
      
        next();
    } catch (error: any) {
        console.error('ClientPurchaseService not initialized when requested:', error.message);
        res.status(500).json({ message: 'Server initialization error. ClientPurchase service not ready.' });
    }
}); 
//getPO single

    router.route('/:tenantId/:poId')
    .get(async (req: Request, res: Response) => {
        try {
            
            
        
            
            const clientPurchaseService = getClientPurchaseOrderRepository(); 

                var tenantId=parseInt(req.params.tenantId);
                var poId=parseInt(req.params.poId);
                     
        
        
            const pos = await clientPurchaseService.getClientPO( tenantId!,poId);
             res.status(200).json(pos);
        } catch (error: any) {
            console.error('Failed to retrieve POs:', error.message || error);
            res.status(500).json({ "message": "Failed to retrieve pos: " + error.message });
        }
    });
//getPOs
    router.route('/:tenantId')
    .get(async (req: Request, res: Response) => {
        try {
            
            
        
            
            const clientPurchaseService = getClientPurchaseOrderRepository(); 

            //var activeTenantId=parseInt(req.query?.activeTenantId?.toString()!);
                 var tenantId=parseInt(req.params.tenantId);    
        
        
            const pos = await clientPurchaseService.getClientPOs( tenantId!);
             res.status(200).json(pos);
        } catch (error: any) {
            console.error('Failed to retrieve POs:', error.message || error);
            res.status(500).json({ "message": "Failed to retrieve pos: " + error.message });
        }
    });


    router.route('/fetchTenantRulesMatrix/:tenantId/:productId/:productVariantId')
    .get(async (req: Request, res: Response) => {
        try {
            console.log('hitting fetchTenantRulesMatrix..........');
            
            
        
            
            const clientPurchaseService = getClientPurchaseOrderRepository(); 

            var activeTenantId=parseInt(req.query?.activeTenantId?.toString()!);
            var prodId=parseInt(req.query?.prodId?.toString()!);
                     var tenantId= parseInt(req.params.tenantId);
        var productId=parseInt(req.params.productId)
        var productVariantId=parseInt(req.params.productVariantId);

            const rulesMatrix = await clientPurchaseService.fetchTenantRulesMatrix(tenantId,productId,productVariantId);
           // console.log('rulesMatrix:',rulesMatrix);
            
             res.status(200).json(rulesMatrix);
        } catch (error: any) {
            console.error('Failed to retrieve POs:', error.message || error);
            res.status(500).json({ "message": "Failed to retrieve pos: " + error.message });
        }
    });

router.route('')
    .post(async (req: Request, res: Response) => {
        try {
        
            const ClientPurchaseService = getClientPurchaseOrderRepository(); 
                console.log('.........................................................usercontext body:',req.body);
            const clientPurchaseOrder = await ClientPurchaseService.createClientPurchaseOrder(req.body);

            res.status(201).json(clientPurchaseOrder);
        } catch (error: any) {
            console.error('ClientPurchase Order creation failed:', error.message || error);
            res.status(400).json({ 'message': 'ClientPurchase Order creation failed: ' + error.message });
        }
    })

 
export default router;