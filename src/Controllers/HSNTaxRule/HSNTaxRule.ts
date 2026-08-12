//Note: HSNTaxRule is not tenant wise
import { Router, Request, Response } from 'express';
import { getHsnTaxRuleRepository } from '../../dependencies';

interface CreateHsnTaxRuleRequestBody {
    hsnCode: string;
    description: string;
    cgstRate?: number;
    sgstRate?: number;
    igstRate?: number;
}

const router = Router();

// Middleware to ensure hsnTaxRuleService is available at run-time
router.use((req, res, next) => {
    try {
        getHsnTaxRuleRepository(); // Attempt to verify initialization from dependencies
        next();
    } catch (error: any) {
        console.error('HsnTaxRuleService not initialized when requested:', error.message);
        res.status(500).json({ message: 'Server initialization error. HsnTaxRule service not ready.' });
    }
}); 

router.route('/:hsnCode')
    .get(async (req: Request, res: Response) => {
        try {
            const hsnCode = req.params.hsnCode;        
            const hsnService = getHsnTaxRuleRepository(); 
            
            const aTaxRule = await hsnService.getHsnTaxRule(hsnCode);
            res.status(200).json(aTaxRule);
        } catch (error: any) {
            console.error('Failed to retrieve an HSN tax rule:', error.message || error);
            res.status(500).json({ "message": "Failed to retrieve an HSN tax rule: " + error.message });
        }
    });

router.route('')
    .get(async (req: Request, res: Response) => {
        try {
            const hsnService = getHsnTaxRuleRepository(); 
            const taxRules = await hsnService.getHsnTaxRules();
            res.status(200).json(taxRules);
        } catch (error: any) {
            console.error('Failed to retrieve HSN tax rules:', error.message || error);
            res.status(500).json({ "message": "Failed to retrieve HSN tax rules: " + error.message });
        }
    })
    .post(async (req: Request<{}, {}, CreateHsnTaxRuleRequestBody>, res: Response) => {
        try {
            const hsnService = getHsnTaxRuleRepository();

            // Basic validation
            if (!req.body.hsnCode || !req.body.description) {
               console.log('Basic validation fail: hsnCode or description missing');
               return res.status(400).json({ message: 'hsnCode and description are required files.' });
            }

            
            const result = await hsnService.createHsnTaxRule(req.body);
            res.status(201).json(result);
        } catch (error: any) {
            console.error('HSN tax rule creation failed:', error.message || error);
            res.status(400).json({ 'message': 'HSN tax rule creation failed: ' + error.message });
        }
    });

export default router;
