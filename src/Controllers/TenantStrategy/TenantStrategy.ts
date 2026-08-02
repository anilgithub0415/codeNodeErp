// src/routes/tenantStrategyRouter.ts (Part 1)
import { Router, Request, Response } from 'express';
import { getTenantStrategyServiceRepository } from '../../dependencies';

const router = Router();

router.use((req, res, next) => {
    try {
        getTenantStrategyServiceRepository();
        next();
    } catch (error: any) {
        console.error('TenantStrategyService initialization verify fault:', error.message);
        res.status(500).json({ message: 'Server initialization error. Strategy service not ready.' });
    }
});

// GET: Fetch individual strategy context
router.route('/:tenantId/:id').get(async (req: Request, res: Response) => {
    try {
        const tenantId = parseInt(req.params.tenantId, 10);        
        const strategyId = parseInt(req.params.id, 10);
        const strategyService = getTenantStrategyServiceRepository(); 
        
        const strategy = await strategyService.getTenantStrategy(tenantId, strategyId);
        if (!strategy) {
            return res.status(404).json({ message: "Tenant strategy entity context entry missing." });
        }
        return res.status(200).json(strategy);
    } catch (error: any) {
        console.error('Failed to retrieve strategy configuration payload:', error.message || error);
        return res.status(500).json({ message: "Failed to retrieve strategy item context: " + error.message });
    }
});

// GET: Fetch full catalog list scoped under target Tenant space
router.route('/:tenantId').get(async (req: Request, res: Response) => {
    try {
        const strategyService = getTenantStrategyServiceRepository();
        const tenantId = parseInt(req.params.tenantId, 10);
                     
        const strategies = await strategyService.getTenantStrategies(tenantId);
        return res.status(200).json(strategies);
    } catch (error: any) {
        console.error('Failed to parse active tenant strategy sets:', error.message || error);
        return res.status(500).json({ message: "Failed to locate active strategy listings: " + error.message });
    }
});
// src/routes/tenantStrategyRouter.ts (Part 2)
// POST: Register brand new context details
router.route('/:tenantId').post(async (req: Request, res: Response) => {
    try {

        console.log('.................creating for tenan:',req.params.tenantId);
        
         const { tenantId } = req.params;
        const strategyService = getTenantStrategyServiceRepository();

        if (!req.body.tenantStrategyName || !req.body.tenantStrategy) {
            return res.status(400).json({ message: 'Both strategy name and configuration text expressions are mandatory.' });
        }

        const securePayload = {
            ...req.body,
            tenantId: tenantId,        // Isolate context within verified space limits
            createdByUserId: req.user.id        // Audit ledger identity insertion tracking
        };

        const strategy = await strategyService.createStrategyClean(securePayload);
        return res.status(201).json(strategy);      
    } catch (error: any) {
        return res.status(400).json({ message: 'Strategy configuration entry write pipeline faulted: ' + error.message });
    }
});

// PUT: Modify details on existing item matching ownership parameters
router.route('/:tenantId/:id').put(async (req: Request, res: Response) => {
    try {
        const strategyService = getTenantStrategyServiceRepository();
        const targetId = parseInt(req.params.id, 10);

        const paramstenantId=parseInt(req.params.tenantId)

        if (isNaN(targetId)) {
            return res.status(400).json({ message: 'Invalid target identifier syntax provided.' });
        }

        const loggedInTenantId = req.user.tenantId;
        const { id, tenantId, ...updatableFields } = req.body;

        const updatedStrategy = await strategyService.updateStrategy(
            targetId, 
           // loggedInTenantId, dont use loggedIn but passed from req.params.tenantId
paramstenantId,
            updatableFields
        );

        return res.status(200).json(updatedStrategy); 
    } catch (error: any) {
        return res.status(400).json({ message: 'Strategy update operation processing failure: ' + error.message });
    }
});

export default router;
