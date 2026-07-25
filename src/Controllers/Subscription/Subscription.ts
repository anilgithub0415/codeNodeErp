import { Router, Request, Response } from 'express';
import { getSubscriptionPlanLookupRepository } from '../../dependencies';

interface CreateSubscriptionPlanRequestBody {
    planName: string;
}

const router = Router();

// Middleware to ensure subscriptionPlanLookupService is available at run-time
router.use((req, res, next) => {
    try {
        getSubscriptionPlanLookupRepository(); // Attempt to verify initialization from dependencies
        next();
    } catch (error: any) {
        console.error('SubscriptionPlanLookupService not initialized when requested:', error.message);
        res.status(500).json({ message: 'Server initialization error. SubscriptionPlanLookup service not ready.' });
    }
}); 

router.route('/:planName')
    .get(async (req: Request, res: Response) => {
        try {
            const planName = req.params.planName;        
            const planService = getSubscriptionPlanLookupRepository(); 
            
            const aPlan = await planService.getSubscriptionPlan(planName);
            res.status(200).json(aPlan);
        } catch (error: any) {
            console.error('Failed to retrieve a Subscription Plan:', error.message || error);
            res.status(500).json({ "message": "Failed to retrieve a Subscription Plan: " + error.message });
        }
    });

router.route('')
    .get(async (req: Request, res: Response) => {
        try {
            const planService = getSubscriptionPlanLookupRepository(); 
            const plans = await planService.getSubscriptionPlans();
            res.status(200).json(plans);
        } catch (error: any) {
            console.error('Failed to retrieve Subscription Plans:', error.message || error);
            res.status(500).json({ "message": "Failed to retrieve Subscription Plans: " + error.message });
        }
    })
    .post(async (req: Request<{}, {}, CreateSubscriptionPlanRequestBody>, res: Response) => {
        try {
            const planService = getSubscriptionPlanLookupRepository();

            // Basic validation
            if (!req.body.planName) {
               console.log('Basic validation fail: planName missing');
               return res.status(400).json({ message: 'planName is a required field.' });
            }

            console.log('.........................................................subscriptionPlan body:', req.body);

            const result = await planService.createSubscriptionPlan(req.body);
            res.status(201).json(result);
        } catch (error: any) {
            console.error('Subscription Plan creation failed:', error.message || error);
            res.status(400).json({ 'message': 'Subscription Plan creation failed: ' + error.message });
        }
    });

export default router;
