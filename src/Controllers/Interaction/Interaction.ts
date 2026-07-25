// src/routes/InteractionRoutes.ts
import { Router, Request, Response } from 'express';
// Assuming you declare a getter for InteractionService in your dependencies
import { getInteractionRepository } from '../../dependencies'; 

// Request body interface for logging an interaction (Manually typed matching your style)
interface CreateInteractionRequestBody {
    customerId: number;
    userId: number;
    channel: 'Call' | 'WhatsApp' | 'Email' | 'In-Person Visit';
    direction: 'Inbound' | 'Outbound';
    purpose?: string;
    notes?: string;
    isSampleFeedback?: boolean;
    attachmentUrl?: string;
    nextFollowUpDate?: Date | null;
    nextFollowUpObjective?: string;
}

// Request body interface for modifying a log entry
interface UpdateInteractionRequestBody {
    purpose?: string;
    notes?: string;
    isSampleFeedback?: boolean;
    attachmentUrl?: string;
    nextFollowUpDate?: Date | null;
    nextFollowUpObjective?: string;
}

const router = Router();

// Middleware to ensure InteractionService is available prior to handling operations
router.use((req, res, next) => {
    try {
        const interactionService = getInteractionRepository(); 
        next();
    } catch (error: any) {
        console.error('InteractionService not initialized when requested:', error.message);
        res.status(500).json({ message: 'Server initialization error. Interaction service not ready.' });
    }
});

// Route to fetch all interactions for a specific client (Kanban/Dashboard grid context)
router.route('/customer/:customerId/ptenantId/:ptenantId')
    .get(async (req: Request, res: Response) => {
        try {
            const tenantId = parseInt(req.params.ptenantId, 10);
            const customerId = parseInt(req.params.customerId, 10);
            
            const interactionService = getInteractionRepository();
            const interactions = await interactionService.getCustomerInteractions(tenantId, customerId);
            
            res.status(200).json(interactions); 
        } catch (error: any) {
            console.error('Failed to retrieve interactions:', error.message || error);
            res.status(500).json({ "message": "Failed to retrieve interactions: " + error.message });
        }
    });

// Base Route for posting a brand new communication log
router.route('/ptenantId/:ptenantId')
    .post(async (req: Request<{ ptenantId: string }, {}, CreateInteractionRequestBody>, res: Response) => {
        try {
            const tenantId = parseInt(req.params.ptenantId, 10);
            const interactionService = getInteractionRepository(); 
            
            const interaction = await interactionService.createInteraction(tenantId, req.body);
            res.status(201).json(interaction); 
        } catch (error: any) {
            console.error('Interaction log creation failed:', error.message || error);
            res.status(400).json({ 'message': error.message });
        }
    });

// Dynamic route for manipulation or deletion of unique interactions
router.route('/:id/ptenantId/:ptenantId')
    .put(async (req: Request<{ id: string, ptenantId: string }, {}, UpdateInteractionRequestBody>, res: Response) => {
        try {
            const id = parseInt(req.params.id, 10);
            const tenantId = parseInt(req.params.ptenantId, 10);
            
            const interactionService = getInteractionRepository(); 
            const updatedInteraction = await interactionService.updateInteraction(id, tenantId, req.body);
            
            if (updatedInteraction) {
                res.status(200).json(updatedInteraction);
            } else {
                res.status(404).json({ 'message': 'Interaction log not found for update.' });
            }
        } catch (error: any) {
            console.error('Interaction log update failed:', error.message || error);
            res.status(400).json({ 'message': 'Interaction update failed: ' + error.message });
        }
    })
    .delete(async (req: Request, res: Response) => {
        try {
            const id = parseInt(req.params.id, 10);
            const tenantId = parseInt(req.params.ptenantId, 10);
            
            const interactionService = getInteractionRepository(); 
            await interactionService.deleteInteraction(id, tenantId);
            
            res.status(204).send(); 
        } catch (error: any) {
            console.error('Interaction deletion failed:', error.message || error);
            res.status(500).json({ 'message': 'Interaction deletion failed: ' + error.message });
        }
    });

export default router;
