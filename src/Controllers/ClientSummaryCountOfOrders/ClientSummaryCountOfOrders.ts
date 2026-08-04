import { Router, Request, Response } from 'express';
import {  getClientPurchaseOrderRepository, getClientRFQOrderRepository, getSalesOrderRepository } from '../../dependencies'; // Replace with your standard DI lookup wrappers


import { POStatus } from '../../entity/ClientPurchaseOrder';
import { RFQStatus } from '../../entity/ClientRFQOrder';


// =====================================================================
// GET: EXTRACT SUMMARY COUNTS FOR PO AND RFQ BY STATUS
const router = Router();



// =====================================================================
router.route('/summary').get(async (req: Request, res: Response) => {
    try {
        const clientPoService = getClientPurchaseOrderRepository();
        const clientRfqService = getClientRFQOrderRepository();

          const SalesService = getSalesOrderRepository();

        // 1. Extract values safely from request query parameters
        const tenantId = req.query.activeTenantId ? parseInt(req.query.activeTenantId as string, 10) : 1;
        const siteId = req.query.siteId ? parseInt(req.query.siteId as string, 10) : undefined;
        
        const queryClientId = req.query.clientId ? parseInt(req.query.clientId as string, 10) : undefined;
        const clientId = isNaN(queryClientId as number) ? undefined : queryClientId;

        if (isNaN(tenantId)) {
            return res.status(400).json({ message: 'Invalid tenant identification parameters supplied.' });
        }

        // 2. Fetch counts concurrently for faster response times
        const [poCounts, rfqCounts, salesCounts] = await Promise.all([
            clientPoService.getPOSummaryCount(tenantId, siteId, clientId),
            clientRfqService.getRFQSummaryCount(tenantId, siteId, clientId),
            SalesService.getSOSummaryCount(tenantId, siteId, clientId)
        ]);

        // 3. Format response structure
        const summaryResponse = {
            clientPurchaseOrders: {
                DRAFT: poCounts[POStatus.DRAFT] || 0,
                PENDING_APPROVAL: poCounts[POStatus.PENDING_APPROVAL] || 0,
                APPROVED: poCounts[POStatus.APPROVED] || 0,
                SENT: poCounts[POStatus.SENT] || 0,
                PARTIALLY_RECEIVED: poCounts[POStatus.PARTIALLY_RECEIVED] || 0,
                CLOSED: poCounts[POStatus.CLOSED] || 0,
                CANCELLED: poCounts[POStatus.CANCELLED] || 0
            },
            clientRFQs: {
                DRAFT: rfqCounts[RFQStatus.DRAFT] || 0,
                PENDING_APPROVAL: rfqCounts[RFQStatus.PENDING_APPROVAL] || 0,
                APPROVED: rfqCounts[RFQStatus.APPROVED] || 0,
                SENT: rfqCounts[RFQStatus.SENT] || 0,
                PARTIALLY_RECEIVED: rfqCounts[RFQStatus.PARTIALLY_RECEIVED] || 0,
                CLOSED: rfqCounts[RFQStatus.CLOSED] || 0,
                CANCELLED: rfqCounts[RFQStatus.CANCELLED] || 0
            },
             sales: {
                DRAFT: salesCounts[POStatus.DRAFT] || 0,
                PENDING_APPROVAL: salesCounts[POStatus.PENDING_APPROVAL] || 0,
                APPROVED: salesCounts[POStatus.APPROVED] || 0,
                SENT: salesCounts[POStatus.SENT] || 0,
                PARTIALLY_RECEIVED: salesCounts[POStatus.PARTIALLY_RECEIVED] || 0,
                CLOSED: salesCounts[POStatus.CLOSED] || 0,
                CANCELLED: salesCounts[POStatus.CANCELLED] || 0
            },
        };

        return res.status(200).json(summaryResponse);
    } catch (error: any) {
        console.error('[Summary Fetch Error]:', error.message);
        return res.status(400).json({ message: 'Failed to read document summary matrix: ' + error.message });
    }
});

export default router