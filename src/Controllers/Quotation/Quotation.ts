import { Router, Request, Response } from 'express';
import { getQuotationRepository } from '../../dependencies'; // Mock Dependency Injection Loader
import { QuotationStatus } from '../../entity/Quotation';
const router = Router();

router.use((req, res, next) => {
    try {
        getQuotationRepository(); 
        next();
    } catch (error: any) {
        console.error('QuotationService not initialized when requested:', error.message);
        res.status(500).json({ message: 'Server initialization error. Quotation service not ready.' });
    }
}); 


//Convert to Quotation new approach:tag:convertToQuoteNewIdea
router.get(
    "/:id/workflow",
    async(req,res,next)=>{

        try{

console.log('......here is tenantid in quotation/123/workflow url:');
            const tenantId=req.user.tenantId;

            const quotationId=Number(req.params.id);
  const quotationService = getQuotationRepository(); 
            const result=
                await quotationService.getWorkflow(
                    quotationId,
                    tenantId
                );

            res.json(result);

        }
        catch(ex){

            next(ex);

        }

    }
);
// ==========================================
// GET: RETRIEVE A SINGLE QUOTATION RECORD
// ==========================================
router.route('/:tenantId/:id')
    .get(async (req: Request, res: Response) => {
        try {
            const quotationService = getQuotationRepository(); 

            const tenantId = parseInt(req.params.tenantId, 10);
            const id = parseInt(req.params.id, 10);
                     
            if (isNaN(tenantId) || isNaN(id)) {
                return res.status(400).json({ message: 'Invalid tenant identification or tracking path ID parameters.' });
            }

            const quotationData = await quotationService.getQuotation(tenantId, id);
            return res.status(200).json(quotationData);
        } catch (error: any) {
            console.error('Failed to retrieve quotation:', error.message || error);
            return res.status(500).json({ "message": "Failed to retrieve quotation: " + error.message });
        }
    });

// ==========================================
// GET: LIST ALL QUOTATIONS BY TENANT (WITH ROLE FILTERING)
// ==========================================
router.route('/:tenantId')
    .get(async (req: Request, res: Response) => {
        try {
                       
            const quotationService = getQuotationRepository(); 
            const tenantId = parseInt(req.params.tenantId, 10);    
        
            if (isNaN(tenantId)) {
                return res.status(400).json({ message: 'Invalid tenant identification path parameters.' });
            }

            // Capture optional clientId from request query attributes (e.g., /12?clientId=1)
            // Note: If you have auth middleware, prefer using req.user.clientId for security!
            const queryClientId = req.query.clientId ? parseInt(req.query.clientId as string, 10) : undefined;
            const clientId = isNaN(queryClientId as number) ? undefined : queryClientId;

            // Capture optional isPortalContext from request query attributes (e.g., /12?clientId=1)
            // Note: If you have auth middleware, prefer using req.user.clientId for security!
           const isPortalContext = req.query.isClientPortal  === 'true';


            const quotations = await quotationService.getQuotations(tenantId, clientId, isPortalContext);
            return res.status(200).json(quotations);
        } catch (error: any) {
            console.error('Failed to retrieve quotations:', error.message || error);
            return res.status(500).json({ "message": "Failed to retrieve quotations: " + error.message });
        }
    });


// ==========================================
// POST: REGISTER A FRESH CLIENT QUOTATION
// ==========================================
router.route('').post(async (req: Request, res: Response) => {
    try {
        const quotationService = getQuotationRepository(); 

        if (!Array.isArray(req.body.items) || req.body.items.length === 0) {
            return res.status(400).json({ message: 'Quotation must include at least one item line.' });
        }

        const securePayload = {
            ...req.body,
            tenantId: req.user.tenantId,        
            createdByUserId: req.user.id        
        };
        console.log('.......................securePayload:', securePayload);

        const result = await quotationService.createQuotationClean(securePayload);
        return res.status(201).json(result);    
    } catch (error: any) {
        return res.status(400).json({ 'message': 'Quotation generation failed: ' + error.message });
    }
});


// ==========================================
// POST: SUBMIT MULTI-ROUND PORTAL COUNTER-OFFER
// ==========================================
router.route('/:id/counter-offer').post(async (req: Request, res: Response) => {
    try {
        const quotationService = getQuotationRepository(); 
        const targetId = parseInt(req.params.id, 10);

        if (isNaN(targetId)) {
            return res.status(400).json({ message: 'Invalid Quotation identification tracking path.' });
        }

        if (!Array.isArray(req.body.items) || req.body.items.length === 0) {
            return res.status(400).json({ message: 'Counter-offer must include at least one item line.' });
        }

        const loggedInTenantId = req.user.tenantId;

        // Strip incoming system wrapper IDs to let repository process iteration logic clean
        const { id, tenantId, ...updatableFields } = req.body;

        // Check if your quotationService has a specialized clone/counter method, 
        // if not, fall back cleanly to your existing save handler while overriding status parameter
        let result;
        if (typeof quotationService.processClientCounterOffer === 'function') {
            result = await quotationService.processClientCounterOffer(targetId, loggedInTenantId, updatableFields);
        } else {
            updatableFields.status = 'COUNTER_OFFERED';
            result = await quotationService.updateQuotation(targetId, loggedInTenantId, updatableFields);
        }

        return res.status(200).json(result);
    } catch (error: any) {
        console.error('Failed to register client counter offer endpoint loop:', error.message || error);
        return res.status(400).json({ 'message': 'Counter-offer registration failed: ' + error.message });
    }
});


router.route('/:id/client-approve').post(async (req: Request, res: Response) => {

    try {

        const quotationService =
            getQuotationRepository();

        const quotationId =
            Number(req.params.id);

        const tenantId =
            req.user.tenantId;

        if (!quotationId || isNaN(quotationId)) {

            return res.status(400).json({
                message: 'Invalid quotation ID.'
            });

        }

        const result =
            await quotationService.clientApproveQuotation(
                quotationId,
                tenantId
            );

        return res.status(200).json({
            message: 'Quotation accepted successfully.',
            quotation: result
        });

    }
    catch (error: any) {

        console.error(
            '[Client Quotation Approve Error]:',
            error.message || error
        );

        return res.status(400).json({
            message:
                'Failed to accept quotation: ' +
                error.message
        });

    }

});

// ==========================================
// PUT: MODIFY AN UNFINISHED CLIENT QUOTATION
// ==========================================
router.route('/:id').put(async (req: Request, res: Response) => {
    try {
        const quotationService = getQuotationRepository(); 
        const targetId = parseInt(req.params.id, 10);

        if (isNaN(targetId)) {
            return res.status(400).json({ message: 'Invalid Quotation identification tracking path.' });
        }

        const loggedInTenantId = req.user.tenantId;
        const { id, tenantId, ...updatableFields } = req.body;

        console.log('updatableFields:',updatableFields);
        const updatedQuotation = await quotationService.updateQuotation(
            targetId, 
            loggedInTenantId, 
            updatableFields
        );

        return res.status(200).json(updatedQuotation); 
    } catch (error: any) {
        return res.status(400).json({ 'message': 'Quotation update failed: ' + error.message });
    }
});


//added
// ==========================================
// PATCH: SUBMIT QUOTATION FOR APPROVAL
// DRAFT -> PENDING_APPROVAL
// ==========================================

router.route('/:id/submit-to-approval').patch(
      async (req: Request, res: Response) => {

console.log('................its submitting for approval....................');

        try {

            const quotationService =
                getQuotationRepository();

            const targetQuoteId =
                parseInt(req.params.id, 10);

            const loggedInTenantId =
                parseInt(req.user.tenantId, 10);

            if (isNaN(targetQuoteId)) {

                return res.status(400).json({
                    message:
                        'Invalid Quotation identification tracking path.'
                });

            }

            const quotation =
                await quotationService.updateQuotationStatus(
                    targetQuoteId,
                    loggedInTenantId,
                    QuotationStatus.PENDING_APPROVAL
                );

            return res.status(200).json({

                message:
                    'Quotation submitted for approval successfully.',

                quotation

            });

        }
        catch (error: any) {

            return res.status(400).json({

                message:
                    'Failed to submit quotation for approval: ' +
                    error.message

            });

        }

    }
);

// ==========================================
// PATCH: SEND DRAFT/REVISED QUOTATION TO CLIENT
// ==========================================
router.route('/:id/send').patch(async (req: Request, res: Response) => {
    try {
        const quotationService = getQuotationRepository(); 
        const targetQuoteId = parseInt(req.params.id, 10);

        if (isNaN(targetQuoteId)) {
            return res.status(400).json({ message: 'Invalid identity tracking index.' });
        }

        const loggedInTenantId = parseInt(req.user.tenantId, 10);

        // Transition the quotation cleanly to SENT status
        const updatedQuotation = await quotationService.updateQuotationStatus(
            targetQuoteId,
            loggedInTenantId,
            QuotationStatus.SENT
        );

        return res.status(200).json({
            message: `Quotation has been successfully sent to the client.`,
            quotation: updatedQuotation
        });
    } catch (error: any) {
        return res.status(400).json({ message: 'Failed to send quotation: ' + error.message });
    }
});

// ==========================================
// PATCH: APPROVE A SENT OR REVISED QUOTATION
// ==========================================
router.route('/:id/approve').patch(async (req: Request, res: Response) => {
    try {
        const quotationService = getQuotationRepository(); 
        const targetQuoteId = parseInt(req.params.id, 10);
        const loggedInTenantId = parseInt(req.user.tenantId, 10);

        if (isNaN(targetQuoteId)) {
            return res.status(400).json({ message: 'Invalid Quotation identification tracking path.' });
        }

        // Approve the quotation (No inventory calculations needed for quotes)
        const approvedQuotation = await quotationService.approveQuotation(
            targetQuoteId,
            loggedInTenantId
        );

        return res.status(200).json({
            message: `Quotation approved successfully. Ready to convert to an Order.`,
            quotation: approvedQuotation
        });
    } catch (error: any) {
        return res.status(400).json({ message: 'Quotation approval failed: ' + error.message });
    }
});


router.route('/:id/revise').patch(async (req: Request, res: Response) => {
    try {
console.log('m here endpoint revise1');

        const quotationService = getQuotationRepository();

        const quoteId = Number(req.params.id);
        const tenantId = Number(req.user.tenantId);

        if (isNaN(quoteId)) {
            return res.status(400).json({
                message: 'Invalid quotation identification.'
            });
        }

        const revisedQuotation =
            await quotationService.processQuotationRevision(
                quoteId,
                tenantId,
                req.body
            );

        return res.status(200).json({
            message: 'Quotation revised successfully.',
            quotation: revisedQuotation
        });

    } catch (error: any) {

        return res.status(400).json({
            message:
                'Quotation revision failed: ' +
                error.message
        });
    }
});

router.post(
    "/convert",
    async (req, res, next) => {
console.log('m at post of quotation convert..............');

        try {

            const tenantId = req.user.tenantId;

            const userId = req.user.id;

            const quotation =
                await getQuotationRepository()
                    .convertRFQToQuotation(
                        tenantId,
                        req.body.rfqId,
                        userId
                    );

            res.json(quotation);

        }
        catch (ex) {
            next(ex);
        }

    }
);
export default router;
