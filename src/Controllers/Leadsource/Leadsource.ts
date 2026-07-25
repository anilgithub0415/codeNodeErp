import { Router, Request, Response } from 'express';
import { getLeadsourceRepository } from '../../dependencies';

interface CreateLeadsourceRequestBody {
    tenantId: number;
    leadSource: string;
    createdByUserId?: number;
}

const router = Router();

// Middleware to ensure leadsourceService is available at run-time
router.use((req, res, next) => {
    try {
        getLeadsourceRepository(); // Attempt to verify initialization from dependencies
        next();
    } catch (error: any) {
        console.error('LeadsourceService not initialized when requested:', error.message);
        res.status(500).json({ message: 'Server initialization error. Leadsource service not ready.' });
    }
}); 

router.route('/:id')
    .get(async (req: Request, res: Response) => {
        try {
            const id = parseInt(req.params.id, 10);        
            const leadsourceService = getLeadsourceRepository(); 
            
            const aLeadsource = await leadsourceService.getLeadsource(id);
            res.status(200).json(aLeadsource);
        } catch (error: any) {
            console.error('Failed to retrieve a Leadsource:', error.message || error);
            res.status(500).json({ "message": "Failed to retrieve a Leadsource: " + error.message });
        }
    });

router.route('')
    .get(async (req: Request, res: Response) => {
        try {
            const leadsourceService = getLeadsourceRepository(); 
            const leadsources = await leadsourceService.getLeadsources(1);
            res.status(200).json(leadsources);
        } catch (error: any) {
            console.error('Failed to retrieve Leadsources:', error.message || error);
            res.status(500).json({ "message": "Failed to retrieve Leadsources: " + error.message });
        }
    })
    .post(async (req: Request<{}, {}, CreateLeadsourceRequestBody>, res: Response) => {
        try {
            const leadsourceService = getLeadsourceRepository();

            // Basic validation
            if (!req.body.tenantId || !req.body.leadSource) {
               console.log('Basic validation fail: tenantId or leadSource missing');
               return res.status(400).json({ message: 'tenantId and leadSource are required fields.' });
            }

            console.log('.........................................................leadsource body:', req.body);

            const result = await leadsourceService.createLeadsource(req.body);
            res.status(201).json(result);
        } catch (error: any) {
            console.error('Leadsource creation failed:', error.message || error);
            res.status(400).json({ 'message': 'Leadsource creation failed: ' + error.message });
        }
    });

export default router;
