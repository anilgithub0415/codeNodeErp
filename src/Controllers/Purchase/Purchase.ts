import { Router, Request, Response } from 'express';
import {getPurchaseOrderRepository} from '../../dependencies'
import { AppDataSource } from '../../../data-source';
import PurchaseService from '../../services/PurchaseService';
import { PurchaseOrder, POStatus } from '../../entity/PurchaseOrder';

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
//getPO single

    router.route('/:tenantId/:poId')
    .get(async (req: Request, res: Response) => {
        try {
            
            
        
            
            const purchaseService = getPurchaseOrderRepository(); 

                var tenantId=parseInt(req.params.tenantId);
                var poId=parseInt(req.params.poId);
                     
        
        
            const pos = await purchaseService.getPO( tenantId!,poId);
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
            
            
        
            
            const purchaseService = getPurchaseOrderRepository(); 

           
                 const loggedInTenantId = req.user.tenantId; // Secure boundary identification lock

        
        
            const pos = await purchaseService.getPOs( loggedInTenantId!);
             res.status(200).json(pos);
        } catch (error: any) {
            console.error('Failed to retrieve POs:', error.message || error);
            res.status(500).json({ "message": "Failed to retrieve pos: " + error.message });
        }
    });


    router.route('/fetchTenantRulesMatrix/:tenantId/:productId/:productVariantId')
    .get(async (req: Request, res: Response) => {
        try {
                  
            const purchaseService = getPurchaseOrderRepository(); 

            var activeTenantId=parseInt(req.query?.activeTenantId?.toString()!);
            var prodId=parseInt(req.query?.prodId?.toString()!);
                     var tenantId= parseInt(req.params.tenantId);
        var productId=parseInt(req.params.productId)
        var productVariantId=parseInt(req.params.productVariantId);

            const rulesMatrix = await purchaseService.fetchTenantRulesMatrix(tenantId,productId,productVariantId);
            //console.log('rulesMatrix:',rulesMatrix);
            
             res.status(200).json(rulesMatrix);
        } catch (error: any) {
            console.error('Failed to retrieve POs:', error.message || error);
            res.status(500).json({ "message": "Failed to retrieve pos: " + error.message });
        }
    });

    // ==========================================
// POST: REGISTER A FRESH PURCHASE ORDER
// ==========================================
router.route('').post(async (req: Request, res: Response) => {
    try {
        const purchaseService = getPurchaseOrderRepository(); // Dynamic DI lookup wrapper [14]

        if (!Array.isArray(req.body.items) || req.body.items.length === 0) {
            return res.status(400).json({ message: 'Purchase Order must include at least one item line.' });
        }

        const securePurchasePayload = {
            ...req.body,
            tenantId: parseInt(req.user.tenantId),        // Lock dynamic multi-tenant context boundary [6]
            createdByUserId: req.user.id,       // Set safe audit tracker identifier
            status: "DRAFT"                     // Force baseline initialization status safely
        };

        const result = await purchaseService.createPurchaseOrderClean(securePurchasePayload);
        return res.status(201).json(result);     // ✅ 201 Created Status
    } catch (error: any) {
        return res.status(400).json({ 'message': 'Purchase Order generation failed: ' + error.message });
    }
});

// ==========================================
// PUT: MODIFY AN UNFINISHED PURCHASE ORDER
// ==========================================
router.route('/:id').put(async (req: Request, res: Response) => {
    try {
        const purchaseService = getPurchaseOrderRepository(); 
        const targetPoId = parseInt(req.params.id, 10);

        if (isNaN(targetPoId)) {
            return res.status(400).json({ message: 'Invalid Purchase Order identification tracking path.' });
        }

        const loggedInTenantId =parseInt(req.user.tenantId);
        const { id, tenantId, poNumber, ...updatableFields } = req.body;

        
        const updatedPo = await purchaseService.updatePurchaseOrder(
            targetPoId, 
            loggedInTenantId, 
            updatableFields
        );

        return res.status(200).json(updatedPo); // ✅ 200 OK Status
    } catch (error: any) {
        return res.status(400).json({ 'message': 'Purchase Order update failed: ' + error.message });
    }
});
// ==========================================
// PATCH: SUBMIT DRAFT FOR APPROVAL (STATUS ONLY)
// ==========================================
router.route('/:id/finalize').patch(async (req: Request, res: Response) => {
    try {
        const purchaseService = getPurchaseOrderRepository(); 
        const targetPoId = parseInt(req.params.id, 10);

        if (isNaN(targetPoId)) {
            return res.status(400).json({ message: 'Invalid identity tracking index.' });
        }

        const loggedInTenantId =parseInt(req.user.tenantId);

        // Clean Update: Only update the status string to PENDING_APPROVAL.
        // We do not call any stock-altering inventory functions here.
        const updatedOrder = await purchaseService.updatePurchaseOrderStatus(
            targetPoId,
            loggedInTenantId,
            POStatus.PENDING_APPROVAL // Sets the new status safely
        );

        return res.status(200).json({
            message: `Purchase Order draft has been successfully submitted for approval.`,
            order: updatedOrder
        });
    } catch (error: any) {
        return res.status(400).json({ message: 'Failed to submit for approval: ' + error.message });
    }
});

// ==========================================
// PATCH: APPROVE A PENDING PURCHASE ORDER (AFFECTS STOCK)
// ==========================================
router.route('/:id/approve').patch(async (req: Request, res: Response) => {
    try {
        const purchaseService = getPurchaseOrderRepository(); 
        const targetPoId = parseInt(req.params.id, 10);
        const loggedInTenantId = parseInt(req.user.tenantId, 10);

        if (isNaN(targetPoId)) {
            return res.status(400).json({ message: 'Invalid Purchase Order identification tracking path.' });
        }

        // Run the approval pipeline which transitions status and increments product balances
        const approvedOrder = await purchaseService.approvePurchaseOrder(
            targetPoId,
            loggedInTenantId
        );

        return res.status(200).json({
            message: `Purchase Order approved successfully. Inventory stock levels updated.`,
            order: approvedOrder
        });
    } catch (error: any) {
        return res.status(400).json({ message: 'Purchase Order approval failed: ' + error.message });
    }
});

// ==========================================
// DELETE: PURGE OR CANCEL A PURCHASE ORDER
// ==========================================
router.route('/:id').delete(async (req: Request, res: Response) => {
    try {
        const purchaseService = getPurchaseOrderRepository(); 
        const targetPoId = parseInt(req.params.id, 10);

        if (isNaN(targetPoId)) {
            return res.status(400).json({ message: 'Invalid Purchase Order identification tracking path.' });
        }

        const loggedInTenantId = parseInt(req.user.tenantId);

        // 1. Fetch the entity context using the ID to obtain the required immutable 'poNumber'
        const purchaseOrderInstance = await AppDataSource.getRepository(PurchaseOrder).findOne({
            where: { id: targetPoId, tenantId: loggedInTenantId }
        });

        if (!purchaseOrderInstance) {
            return res.status(404).json({ 
                message: `Purchase Order record with identification tracking index ${targetPoId} not found.` 
            });
        }

        // 2. Forward straight into service transactional persistence layer engine
        const operationResult = await purchaseService.handleDeleteOrCancelRequest(
            loggedInTenantId,
            purchaseOrderInstance.poNumber
        );

        // 3. Return structural metadata back to the client application
        return res.status(200).json({
            message: `Purchase Order was successfully managed.`,
            ...operationResult
        });
    } catch (error: any) {
        return res.status(400).json({ message: 'Purchase Order removal failed: ' + error.message });
    }
});



 
export default router;