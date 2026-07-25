import { Router, Request, Response } from 'express';
import { getClientRequirementRepository } from '../../dependencies'; // Dynamic DI tracking mapper

const router = Router();

// Middleware to ensure the service repository initialization layer is active
router.use((req, res, next) => {
    try {
        getClientRequirementRepository(); 
        next();
    } catch (error: any) {
        console.error('ClientRequirementService not initialized when requested:', error.message);
        res.status(500).json({ message: 'Server initialization error. Client requirement service not ready.' });
    }
}); 

// ==========================================
// GET: RETRIEVE A SINGLE CLIENT REQUIREMENT
// ==========================================
router.route('/:tenantId/:id')
    .get(async (req: Request, res: Response) => {
        try {
            const clientService = getClientRequirementRepository(); 

            const tenantId = parseInt(req.params.tenantId, 10);
            const id = parseInt(req.params.id, 10);
                     
            if (isNaN(tenantId) || isNaN(id)) {
                return res.status(400).json({ message: 'Invalid tenant identification or tracking path ID parameters.' });
            }

            const requestData = await clientService.getClientRequirement(tenantId, id);
            return res.status(200).json(requestData);
        } catch (error: any) {
            console.error('Failed to retrieve client requirement:', error.message || error);
            return res.status(500).json({ "message": "Failed to retrieve client requirement: " + error.message });
        }
    });

// ==========================================
// GET: LIST ALL CLIENT REQUIREMENTS BY TENANT
// ==========================================
router.route('/:tenantId')
    .get(async (req: Request, res: Response) => {
        try {
            const clientService = getClientRequirementRepository(); 
            const tenantId = parseInt(req.params.tenantId, 10);    
        
            if (isNaN(tenantId)) {
                return res.status(400).json({ message: 'Invalid tenant identification path parameters.' });
            }

            // 1. 💡 EXTRACT OPTIONAL PARAMETER: Read clientId out of query parameter strings
            const queryClientId = req.query.clientId;
            let clientId: number | undefined = undefined;

            if (queryClientId) { 
            
                clientId = parseInt(queryClientId as string, 10);
                if (isNaN(clientId)) {
                    return res.status(400).json({ message: 'Invalid optional client identification string metric.' });
                }
            }

            // 2. Dispatch updated parameter signature arguments safely into the engine 
            const clientRequests = await clientService.getClientRequirements(tenantId, clientId);
            return res.status(200).json(clientRequests);
        } catch (error: any) {
            console.error('Failed to retrieve client requirements:', error.message || error);
            return res.status(500).json({ "message": "Failed to retrieve client requirements: " + error.message });
        }
    });


// ==========================================
// POST: REGISTER A FRESH CLIENT REQUIREMENT
// ==========================================
router.route('').post(async (req: Request, res: Response) => {
    try {
        const clientService = getClientRequirementRepository(); 

        if (!Array.isArray(req.body.items) || req.body.items.length === 0) {
            return res.status(400).json({ message: 'Client Requirement must include at least one item line.' });
        }

        const securePayload = {
            ...req.body,
            tenantId: req.user.tenantId,        // Secure multi-tenant perimeter context boundary
            createdByUserId: req.user.id        // Safe audit tracker injection identity
        };

        const result = await clientService.createClientRequirementClean(securePayload);
        return res.status(201).json(result);    // ✅ 201 Created Status
    } catch (error: any) {
        return res.status(400).json({ 'message': 'Client Requirement generation failed: ' + error.message });
    }
});

// ==========================================
// PUT: MODIFY AN UNFINISHED CLIENT REQUIREMENT
// ==========================================
router.route('/:id').put(async (req: Request, res: Response) => {
    try {
        const clientService = getClientRequirementRepository(); 
        const targetId = parseInt(req.params.id, 10);

        if (isNaN(targetId)) {
            return res.status(400).json({ message: 'Invalid Client Requirement identification tracking path.' });
        }

        const loggedInTenantId = req.user.tenantId;
        const { id, tenantId, ...updatableFields } = req.body;

        const updatedRequest = await clientService.updateClientRequirement(
            targetId, 
            loggedInTenantId, 
            updatableFields
        );

        return res.status(200).json(updatedRequest); // ✅ 200 OK Status
    } catch (error: any) {
        return res.status(400).json({ 'message': 'Client Requirement update failed: ' + error.message });
    }
});

export default router;
