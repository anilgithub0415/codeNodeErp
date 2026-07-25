import { Router, Request, Response } from 'express';
import { getVendorRepository } from '../../dependencies';

interface CreateVendorRequestBody {
    tenantId: number;
    vendorName: string;
    description: string;
}

const router = Router();

// Middleware to ensure VendorService is available
router.use((req, res, next) => {
    try {
        getVendorRepository(); 
        next();
    } catch (error: any) {
        console.error('VendorService not initialized when requested:', error.message);
        res.status(500).json({ message: 'Server initialization error. Vendor service not ready.' });
    }
}); 

// ==========================================
// GET: RETRIEVE A SPECIFIC VENDOR
// ==========================================
router.route('/:tenantId/:id').get(async (req: Request, res: Response) => {
    try {
        const tenantId = parseInt(req.params.tenantId, 10);        
        const prodId = parseInt(req.params.id, 10);
        const vendorService = getVendorRepository(); 
        
        const aVendor = await vendorService.getVendor(tenantId, prodId);
        return res.status(200).json(aVendor);
    } catch (error: any) {
        console.error('Failed to retrieve a vendor:', error.message || error);
        return res.status(500).json({ "message": "Failed to retrieve a vendor: " + error.message });
    }
});

// ==========================================
// GET: LIST ALL VENDORS UNDER A TENANT
// ==========================================
router.route('/:tenantId').get(async (req: Request, res: Response) => {
    try {
        console.log('..............................................................hitting vendor/1');
        const vendorService = getVendorRepository(); 
        const tenantId = parseInt(req.params.tenantId, 10);
        
        const vendors = await vendorService.getVendors(tenantId);
        return res.status(200).json(vendors);
    } catch (error: any) {
        console.error('Failed to retrieve vendors:', error.message || error);
        return res.status(500).json({ "message": "Failed to retrieve vendors: " + error.message });
    }
});

// ==========================================
// POST: REGISTER A NEW VENDOR
// ==========================================
router.route('').post(async (req: Request<{}, {}, CreateVendorRequestBody>, res: Response) => {
    try {
        const vendorService = getVendorRepository();

        if (!req.body.vendorName) {
           return res.status(400).json({ message: 'Vendor name is required' });
        }

        const secureVendorPayload = {
            ...req.body,
            tenantId: req.user.tenantId,       // Lock data namespace context 
            createdByUserId: req.user.id        // Audit log identification stamp
        };

        const vendor = await vendorService.createVendorClean(secureVendorPayload);
        return res.status(201).json(vendor);    // ✅ 201 Created Status
    } catch (error: any) {
        console.error('Vendor creation failed:', error.message || error);
        return res.status(400).json({ 'message': 'Vendor creation failed: ' + error.message }); 
    }
});

// ==========================================
// PUT: MODIFY AN EXISTING VENDOR
// ==========================================
router.route('/:id').put(async (req: Request, res: Response) => {
    try {
        const vendorService = getVendorRepository();
        const targetVendorId = parseInt(req.params.id, 10);

        if (isNaN(targetVendorId)) {
            return res.status(400).json({ message: 'Invalid Vendor identification ID path format parameter.' });
        }

        const loggedInTenantId = req.user.tenantId;
        const { id, tenantId, ...updatableFields } = req.body;

        const updatedVendor = await vendorService.updateVendor(
            targetVendorId, 
            loggedInTenantId, 
            updatableFields
        );

        return res.status(200).json(updatedVendor); // ✅ 200 OK Status
    } catch (error: any) {
        console.error('Vendor update failed:', error.message || error);
        return res.status(400).json({ 'message': 'Vendor update failed: ' + error.message });
    }
});

export default router;
