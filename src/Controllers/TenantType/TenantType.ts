// src/routes/tenantTypeLookupRouter.ts (Part 1)
import { Router, Request, Response } from 'express';
import { getTenantTypeRepository } from '../../dependencies'; // Adjust based on your dependency injection setup

const router = Router();

// Runtime validation injection container check
router.use((req, res, next) => {
    try {
        getTenantTypeRepository();
        next();
    } catch (error: any) {
        console.error('TenantTypeLookupService dependency exception:', error.message);
        res.status(500).json({ message: 'Server initialization error. Lookup service not ready.' });
    }
});

// GET: Fetch all lookup structural elements
router.route('').get(async (req: Request, res: Response) => {
    try {
        const lookupService = getTenantTypeRepository();
        const trackingList = await lookupService.getTenantTypes();
        return res.status(200).json(trackingList);
    } catch (error: any) {
        console.error('Failed to retrieve lookup list:', error.message || error);
        return res.status(500).json({ message: "Failed to retrieve lookup rows: " + error.message });
    }
});
// src/routes/tenantTypeLookupRouter.ts (Part 2)
// POST: Register a brand new Lookup record context entry
router.route('').post(async (req: Request, res: Response) => {
    try {
        const lookupService = getTenantTypeRepository();
        const { typeName } = req.body;

        if (!typeName || typeof typeName !== 'string' || typeName.trim() === '') {
            return res.status(400).json({ message: 'typeName property string is highly required.' });
        }

        const newRecord = await lookupService.createTenantType({typeName:typeName.trim()});
        return res.status(201).json(newRecord);
    } catch (error: any) {
        return res.status(400).json({ message: 'Lookup record generation failed: ' + error.message });
    }
});

// DELETE: Safely purge a structural target lookup element
// router.route('/:typeName').delete(async (req: Request, res: Response) => {
//     try {
//         const lookupService = getTenantTypeRepository();
//         const targetName = req.params.typeName;

//         await lookupService.deleteType(targetName);
//         return res.status(200).json({ message: `Tenant type '${targetName}' successfully purged.` });
//     } catch (error: any) {
//         return res.status(400).json({ message: 'Purge operation aborted: ' + error.message });
//     }
// });

export default router;
