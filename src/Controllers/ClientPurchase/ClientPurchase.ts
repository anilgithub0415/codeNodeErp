import { Router, Request, Response } from 'express';
import { getClientPurchaseOrderRepository, getClientRFQOrderRepository } from '../../dependencies'; // Replace with your standard DI lookup wrappers
import { authorizeRoles } from '../Login/authorizeRoles';

import { AppDataSource } from '../../../data-source';
import { ClientPurchaseOrder } from '../../entity/ClientPurchaseOrder';
const router = Router();




router.route('/:id').get(async (req: Request, res: Response) => {
    try {
        
        
        const clientPoService = getClientPurchaseOrderRepository();

        // 1. Extract values safely from request query parameters
        const tenantId = req.query.activeTenantId ? parseInt(req.query.activeTenantId as string, 10) : 1; 

        const id =parseInt( req.params.id);
      

      

        if (isNaN(tenantId)) {
            return res.status(400).json({ message: 'Invalid tenant identification parameters supplied.' });
        }

        const result = await clientPoService.getClientPO(tenantId,  id);

        return res.status(200).json(result);
    } catch (error: any) {
        console.error('[CPO Listing Fetch Error]:', error.message);
        return res.status(400).json({ message: 'Failed to read document registries: ' + error.message });
    }
});

// =====================================================================
// GET: EXTRACT LIST REGISTERS BY TENANT, SITE, CLIENT, AND STATUS FILTER
// =====================================================================
router.route('').get(async (req: Request, res: Response) => {
    try {
        console.log('....m here.......');
        
        const clientPoService = getClientPurchaseOrderRepository();

        // 1. Extract values safely from request query parameters
        const tenantId = req.query.activeTenantId ? parseInt(req.query.activeTenantId as string, 10) : 1; 
       // const siteId = req.query.siteId ? parseInt(req.query.siteId as string, 10) : undefined;
        // Update this line in your router:
const siteId = req.query.siteId 
    ? (req.query.siteId === 'null' ? null : parseInt(req.query.siteId as string, 10)) 
    : undefined;

        const queryClientId = req.query.clientId ? parseInt(req.query.clientId as string, 10) : undefined;
        const clientId = isNaN(queryClientId as number) ? undefined : queryClientId;

        // 🚀 NEW: Safely extract and format dynamic status values
        let statuses: string[] | undefined = undefined;
        if (req.query.status) {
            // Handles both comma-separated strings (?status=APPROVED,SENT) and arrays (?status=APPROVED&status=SENT)
            const rawStatus = req.query.status as string | string[];
            statuses = Array.isArray(rawStatus) 
                ? rawStatus 
                : rawStatus.split(',').map(s => s.trim());
        }

        const includeConverted =
    req.query.includeConverted === 'true';


        if (isNaN(tenantId)) {
            return res.status(400).json({ message: 'Invalid tenant identification parameters supplied.' });
        }

        console.log(`Extracting registers for Tenant: ${tenantId}, Site: ${siteId}, Client: ${clientId}, Statuses: ${statuses}`);

        // 2. Fetch the dynamic dataset array using our refined service architecture
        // 🚀 UPDATED: Added statuses argument to service call
        const resultList = await clientPoService.getClientPOsFiltered(tenantId, siteId!, clientId, statuses,includeConverted);

        return res.status(200).json(resultList);
    } catch (error: any) {
        console.error('[CPO Listing Fetch Error]:', error.message);
        return res.status(400).json({ message: 'Failed to read document registries: ' + error.message });
    }
});

//

// ==================================================
// DELETE: PURGE OR CANCEL A CLIENT PURCHASE ORDER
// ==================================================
router.route('/:id').delete(async (req: Request, res: Response) => {
    try {
        // Assuming you have a getter function or instance for the client purchase service
        const clientPurchaseService = getClientPurchaseOrderRepository(); 
        const targetPoId = parseInt(req.params.id, 10);

        if (isNaN(targetPoId)) {
            return res.status(400).json({ message: 'Invalid Client Purchase Order identification tracking path.' });
        }

        const loggedInTenantId = parseInt(req.user.tenantId, 10);

        // 1. Fetch the entity context using the ID to obtain the required immutable 'clientPoNumber'
        const clientPurchaseOrderInstance = await AppDataSource.getRepository(ClientPurchaseOrder).findOne({
            where: { id: targetPoId, tenantId: loggedInTenantId }
        });

        if (!clientPurchaseOrderInstance) {
            return res.status(404).json({ 
                message: `Client Purchase Order record with identification tracking index ${targetPoId} not found.` 
            });
        }

        // 2. Forward straight into service transactional persistence layer engine
        const operationResult = await clientPurchaseService.handleDeleteOrCancelClientRequest(
            loggedInTenantId,
            clientPurchaseOrderInstance.clientPoNumber!
        );

        // 3. Return structural metadata back to the client application
        return res.status(200).json({
            message: `Client Purchase Order was successfully managed.`,
            ...operationResult
        });
    } catch (error: any) {
        return res.status(400).json({ message: 'Client Purchase Order removal failed: ' + error.message });
    }
});


// ==========================================
// POST: RECORD CLIENT PURCHASE ORDER
// ==========================================
router.route('').post(async (req: Request, res: Response) => {
    try {
        console.log('..........................posting client PO.................', req.body);
        
        const clientPoService = getClientPurchaseOrderRepository();

        // Structural Payload Integrity Gateways
        if (!req.body.clientId) {
            return res.status(400).json({ message: 'Client/Wholesaler Customer ID assignment is required.' });
        }
        if (!Array.isArray(req.body.items) || req.body.items.length === 0) {
            return res.status(400).json({ message: 'Client Purchase Order must contain at least one item line.' });
        }
  
        const loggedInTenantId = req.user.tenantId;

        console.log('middle step......................................');
        
        // Process line items carefully
        let sanitizedItems;
        try {
            sanitizedItems = req.body.items.map((item: any) => {
                // Parse IDs safely only if they are valid numeric entries
                const hasProduct = item.productId !== undefined && item.productId !== null && !isNaN(Number(item.productId)) && Number(item.productId) !== 0;
                const hasVariant = item.productVariantId !== undefined && item.productVariantId !== null && !isNaN(Number(item.productVariantId)) && Number(item.productVariantId) !== 0;

                // 🚀 FIXED: Retain the string label passed from the frontend form
                const backupName = item.prodName || item.productName || 'Unknown Material Specification';

                return {
    productId: hasProduct ? Number(item.productId) : null,
    productVariantId: hasVariant ? Number(item.productVariantId) : null,
    quantity: Number(item.quantity || 1),
    purchaseUom: item.purchaseUom ? String(item.purchaseUom).trim() : 'PCS',
    prodName: item.prodName || 'Free-text Product Specification',
    sku: item.sku || null // 👈 FIXED: Ensure this line passes your SKU field through!
};

            });
        } catch (validationErr: any) {
            return res.status(400).json({ message: validationErr.message });
        }

        console.log('second middle step......................................');
               console.log('second middle step......................................');
        const securePayload = {
            tenantId: loggedInTenantId,
            clientId: Number(req.body.clientId),
            // 🚀 ENSURE THIS COLUMN ALIGNS PERFECTLY WITH YOUR NEW CAMELCASE VARIABLE NAME:
            siteId: req.body.siteId ? Number(req.body.siteId) : null, 
            clientNotes: req.body.clientNotes || '',
            requestedDeliveryDate: req.body.requestedDeliveryDate ? new Date(req.body.requestedDeliveryDate) : null,
            status: "DRAFT", 
            items: sanitizedItems
        };


        console.log('..........................posting client PO.................', securePayload);

        // Add type assertion at the method call boundary
        const result = await clientPoService.createClientPurchaseOrder(securePayload as any);

        return res.status(201).json(result);
    } catch (error: any) {
        console.error('[CPO POST Router Error]:', error.message || error);
        return res.status(400).json({ message: 'Failed to record Client Purchase Order: ' + error.message });
    }
});


// 2. PUT Endpoint: For updating drafts OR submitting them for approval
router.route('/:id').put(async (req: Request, res: Response) => {
    try {
        
        const clientPoService = getClientPurchaseOrderRepository();
        
        const poId = Number(req.params.id);
        const loggedInTenantId = req.user.tenantId;

        if (isNaN(poId)) {
            return res.status(400).json({ message: 'Invalid Purchase Order ID sequence.' });
        }

        // Construct update bundle safely
        const updatePayload: any = {};
        
        if (req.body.clientId) updatePayload.clientId = Number(req.body.clientId);
        if (req.body.siteId) updatePayload.siteId = Number(req.body.siteId);
        if (req.body.clientNotes !== undefined) updatePayload.clientNotes = req.body.clientNotes;
        if (req.body.requestedDeliveryDate) {
            updatePayload.requestedDeliveryDate = new Date(req.body.requestedDeliveryDate);
        }

        // 🔄 Action Trigger Processing: Check if user is clicking "Submit for Approval"
        // The frontend will pass { action: "SUBMIT" } or { status: "PENDING_APPROVAL" }
        if (req.body.action === 'SUBMIT' || req.body.status === 'PENDING_APPROVAL') {
            updatePayload.status = 'PENDING_APPROVAL';
        }

        // Sanitize incoming array items safely if provided during editing
        if (req.body.items) {
            if (!Array.isArray(req.body.items) || req.body.items.length === 0) {
                return res.status(400).json({ message: 'Updated order cannot be empty.' });
            }

            updatePayload.items = req.body.items.map((item: any) => {
                const hasProduct = item.productId !== undefined && item.productId !== null;
                const hasVariant = item.productVariantId !== undefined && item.productVariantId !== null;

                if ((hasProduct && hasVariant) || (!hasProduct && !hasVariant)) {
                    throw new Error('Each line must specify exactly one option: productId OR productVariantId.');
                }

                return {
                    productId: hasProduct ? Number(item.productId) : null,
                    productVariantId: hasVariant ? Number(item.productVariantId) : null,
                    quantity: Number(item.quantity || 1),
                    purchaseUom: item.purchaseUom ? String(item.purchaseUom).trim() : null
                };
            });
        }

        // Invoke the update method we introduced into your service layer
        const result = await clientPoService.updateClientPurchaseOrder(poId, loggedInTenantId, updatePayload);
        return res.status(200).json(result);

    } catch (error: any) {
        console.error('[CPO PUT Router Error]:', error.message || error);
        return res.status(400).json({ message: 'Failed to update Client Purchase Order: ' + error.message });
    }
});

router.route('/:id/approve').post(async (req: Request, res: Response) => {
    try {
        const clientPoService = getClientPurchaseOrderRepository();
        const poId = Number(req.params.id);
        const loggedInTenantId = req.user.tenantId;
        const { action, items } = req.body; 

        // 🚦 Strict API Validation for the Action Header
        if (action !== 'APPROVE' && action !== 'REJECT') {
            return res.status(400).json({ message: 'Invalid action. Must be APPROVE or REJECT.' });
        }

        // 📑 Sanitize items if modifications are bundled with the approval request
        let sanitizedItems = undefined;
        if (items) {
            if (!Array.isArray(items) || items.length === 0) {
                return res.status(400).json({ message: 'Modified items array cannot be empty.' });
            }
            sanitizedItems = items.map((item: any) => {
                const hasProduct = item.productId !== undefined && item.productId !== null;
                const hasVariant = item.productVariantId !== undefined && item.productVariantId !== null;

                if ((hasProduct && hasVariant) || (!hasProduct && !hasVariant)) {
                    throw new Error('Each line item must contain exactly one: productId OR productVariantId.');
                }

                return {
                    productId: hasProduct ? Number(item.productId) : null,
                    productVariantId: hasVariant ? Number(item.productVariantId) : null,
                    quantity: Number(item.quantity || 1),
                    purchaseUom: item.purchaseUom ? String(item.purchaseUom).trim() : null
                };
            });
        }

        // Pass payload downstream to the updated service method
        const result = await clientPoService.processPoApproval(poId, loggedInTenantId, action, sanitizedItems);
        return res.status(200).json(result);

    } catch (error: any) {
        console.error('[CPO Approval Router Error]:', error.message || error);
        return res.status(400).json({ message: 'Failed to process PO workflow: ' + error.message });
    }
});

router.route('/:id/send').post(async (req: Request, res: Response) => {
try {
const clientPoService = getClientPurchaseOrderRepository();
const poId = Number(req.params.id);
const loggedInTenantId = req.user.tenantId;
const { action, items } = req.body; 

// 🚦 Strict API Validation for the Action Header
if (action !== 'SENT') {
    return res.status(400).json({ message: 'Invalid action. Must be SENT.' });
}

// 📑 Sanitize items if modifications are bundled with the send request
let sanitizedItems = undefined;
if (items) {
    if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: 'Modified items array cannot be empty.' });
    }
    sanitizedItems = items.map((item: any) => {
        const hasProduct = item.productId !== undefined && item.productId !== null;
        const hasVariant = item.productVariantId !== undefined && item.productVariantId !== null;

        if ((hasProduct && hasVariant) || (!hasProduct && !hasVariant)) {
            throw new Error('Each line item must contain exactly one: productId OR productVariantId.');
        }

        return {
            productId: hasProduct ? Number(item.productId) : null,
            productVariantId: hasVariant ? Number(item.productVariantId) : null,
            quantity: Number(item.quantity || 1),
            purchaseUom: item.purchaseUom ? String(item.purchaseUom).trim() : null
        };
    });
}

// Pass payload downstream to the updated service method
const result = await clientPoService.processPoDispatch(poId, loggedInTenantId, action, sanitizedItems);
return res.status(200).json(result);

} catch (error: any) {
console.error('[CPO Send Router Error]:', error.message || error);
return res.status(400).json({ message: 'Failed to process PO workflow: ' + error.message });
}

});


// =====================================================
// CONVERT CLIENT PURCHASE ORDER TO SALES ORDER
// =====================================================
router.route('/:id/convert-to-sales').post(async (req: Request, res: Response) => {
    try {

        const clientPoService = getClientPurchaseOrderRepository();

        const poId = Number(req.params.id);
        const tenantId = Number(req.user.tenantId);
        const createdByUserId= req.user.id;   
        if (isNaN(poId)) {
            return res.status(400).json({
                message: 'Invalid Purchase Order Id.'
            });
        }

        const result = await clientPoService.convertClientPOToSalesOrder(
            poId,
            tenantId,
            createdByUserId
        );

        return res.status(200).json(result); 

    } catch (error: any) {
 
        console.error(error);

        return res.status(400).json({
            message: error.message
        });
    }
});

export default router;
