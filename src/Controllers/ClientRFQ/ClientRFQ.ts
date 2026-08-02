import { Router, Request, Response } from 'express';
import {  getClientRFQOrderRepository } from '../../dependencies'; // Replace with your standard DI lookup wrappers
import { authorizeRoles } from '../Login/authorizeRoles';

const router = Router();


//
//Pending: In all Endpoints, Better to use below type of Secure boundary identification locks: 
// const loggedInTenantId = req.user.tenantId; // Secure boundary identification lock
//valid urls:
// api/clientRFQ?activeTenantId=1&clientId=1
// api/clientRFQ?activeTenantId=1
// =====================================================================
// GET: EXTRACT LIST REGISTERS BY TENANT, SITE, AND OPTIONAL CLIENT FILTER
// =====================================================================
router.route('').get(async (req: Request, res: Response) => {
    try {
         console.log('.....only get is working..........................................................................');
        
        const clientPoService = getClientRFQOrderRepository();

        // 1. Extract values safely from request query parameters
        const tenantId = req.query.activeTenantId ? parseInt(req.query.activeTenantId as string, 10) : 1; // Fallback default tracking values preserved
        const siteId = req.query.siteId ? parseInt(req.query.siteId as string, 10) : undefined;
        
        // 🚀 NEW: Safely check for incoming Client filtering requirements
        const queryClientId = req.query.clientId ? parseInt(req.query.clientId as string, 10) : undefined;
        const clientId = isNaN(queryClientId as number) ? undefined : queryClientId;

        if (isNaN(tenantId)) {
            return res.status(400).json({ message: 'Invalid tenant identification parameters supplied.' });
        }

        console.log(`Extracting registers for Tenant: ${tenantId}, Site: ${siteId}, Client: ${clientId}`);

        // 2. Fetch the dynamic dataset array using our refined service architecture
        const resultList = await clientPoService.getClientRFQsFiltered(tenantId, siteId, clientId);
console.log(resultList);

        return res.status(200).json(resultList);
    } catch (error: any) {
        console.error('[CRFQ Listing Fetch Error]:', error.message);
        return res.status(400).json({ message: 'Failed to read document registries: ' + error.message });
    }
});

// =====================================================================
// GET: EXTRACT ALL CLIENT PURCHASE ORDERS UNDER SECURE TENANT
// =====================================================================
router.route('').get(authorizeRoles('Site_Supervisor', 'Client'),async (req: Request, res: Response) => {
    try {
        console.log('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
        const clientPoService = getClientRFQOrderRepository();
        const loggedInTenantId = req.user.tenantId; // Secure boundary identification lock

        const results = await clientPoService.getClientPOs(loggedInTenantId);
        return res.status(200).json(results); // ✅ 200 OK
    } catch (error: any) {
        console.error('[CRFQ Bulk Fetch Error]:', error.message);
        return res.status(400).json({ message: 'Failed to retrieve context documents: ' + error.message });
    }
});



// ==========================================
// POST: RECORD CLIENT PURCHASE ORDER
// ==========================================
router.route('').post(async (req: Request, res: Response) => {
    try {
        console.log('..........................posting client PO.................', req.body);
        
        const clientPoService = getClientRFQOrderRepository();

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
        const result = await clientPoService.createClientRFQOrder(securePayload as any);

        return res.status(201).json(result);
    } catch (error: any) {
        console.error('[CRFQ POST Router Error]:', error.message || error);
        return res.status(400).json({ message: 'Failed to record Client Purchase Order: ' + error.message });
    }
});


// 2. PUT Endpoint: For updating drafts OR submitting them for approval
router.route('/:id').put(async (req: Request, res: Response) => {
    try {
        
        const clientPoService = getClientRFQOrderRepository();
        
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
        const result = await clientPoService.updateClientRFQOrder(poId, loggedInTenantId, updatePayload);
        return res.status(200).json(result);

    } catch (error: any) {
        console.error('[CRFQ PUT Router Error]:', error.message || error);
        return res.status(400).json({ message: 'Failed to update Client Purchase Order: ' + error.message });
    }
});
router.route('/:id/approve').post(async (req: Request, res: Response) => {
    try {
        const clientPoService = getClientRFQOrderRepository();
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
        const result = await clientPoService.processRFQApproval(poId, loggedInTenantId, action, sanitizedItems);
        return res.status(200).json(result);

    } catch (error: any) {
        console.error('[CRFQ Approval Router Error]:', error.message || error);
        return res.status(400).json({ message: 'Failed to process PO workflow: ' + error.message });
    }
});


export default router;
