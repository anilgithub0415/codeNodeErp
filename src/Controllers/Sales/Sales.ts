import { Router, Request, Response } from 'express';
import { getSalesOrderRepository} from '../../dependencies'
import { AppDataSource } from '../../../data-source';
import { SalesOrder } from '../../entity/SalesOrder';

const router = Router();
// Middleware to ensure settingsService is available (optional, but good for clarity)
// Or rely on the fact that dependencies.ts ensures it at startup
router.use((req, res, next) => {
    
    try {
       const SalesService = getSalesOrderRepository(); // Attempt to get the service
      
        next();
    } catch (error: any) {
        console.error('SalesService not initialized when requested:', error.message);
        res.status(500).json({ message: 'Server initialization error. Sales service not ready.' });
    }
}); 

router.route('/:tenantId/:id')
    .get(async (req: Request, res: Response) => {
        try {
            const salesService = getSalesOrderRepository(); 
            var tenantId=parseInt(req.params.tenantId)
           var SOid= parseInt(req.params.id);
            const so = await salesService.getSO( tenantId!,SOid);
            
           
             res.status(200).json(so);
        } catch (error: any) {
            console.error('Failed to retrieve SOs:', error.message || error);
            res.status(500).json({ "message": "Failed to retrieve pos: " + error.message });
        }
    });

    router.route('/:tenantId')
    .get(async (req: Request, res: Response) => {
        try {
            const salesService = getSalesOrderRepository(); 
            var tenantId=parseInt(req.params.tenantId)
           
            const sos = await salesService.getSOs( tenantId!);
           
           
             res.status(200).json(sos);
        } catch (error: any) {
            console.error('Failed to retrieve SOs:', error.message || error);
            res.status(500).json({ "message": "Failed to retrieve pos: " + error.message });
        }
    });

    
    router.route('/fetchTenantRulesMatrix/:tenantId/:productId/:productVariantId')
    .get(async (req: Request, res: Response) => {
        try {
             
            const salesService = getSalesOrderRepository(); 

            var activeTenantId=parseInt(req.query?.activeTenantId?.toString()!);
            var prodId=parseInt(req.query?.prodId?.toString()!);
                     var tenantId= parseInt(req.params.tenantId);
        var productId=parseInt(req.params.productId)
        var productVariantId=parseInt(req.params.productVariantId);

            const rulesMatrix = await salesService.fetchTenantSalesRulesMatrix(tenantId,productId,productVariantId);
           // console.log('rulesMatrix:',rulesMatrix);
            
             res.status(200).json(rulesMatrix);
        } catch (error: any) {
            console.error('Failed to retrieve POs:', error.message || error);
            res.status(500).json({ "message": "Failed to retrieve pos: " + error.message });
        }
    });


//Autonumbering sales order generateSalesOrderNumber
router.route('/SOautonumering')
    .get(async (req: Request, res: Response) => {
     const { customerId, channelCode, items } = req.body; 
      const salesService = getSalesOrderRepository(); 


    // Initialize transaction to wrap sequence allocation and order placement together
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
        // Generate the auto-coded string inside the transaction context
        const generatedSoNumber = await salesService.generateSalesOrderNumber(queryRunner.manager, channelCode);

        // Map request to the entity object
        const newOrder = new SalesOrder();
        newOrder.soNumber = generatedSoNumber;
        newOrder.siteId = customerId;
        newOrder.status = "DRAFT"; // Set standard initial status

        // Persist the order 
        const savedOrder = await queryRunner.manager.save(SalesOrder, newOrder);

        // Complete database transaction safely
        await queryRunner.commitTransaction();
        
        return res.status(21).json({ success: true, data: savedOrder });

    } catch (error1:any) {
        // Rollback all database modifications if an execution error occurs
        await queryRunner.rollbackTransaction();
        return res.status(500).json({ success: false, message: "Order creation failed", error: error1.message });
    } finally {
        // Release connection pool back to SQL Server
        await queryRunner.release();
    }
});







// =====================================================================
// POST: REGISTER A FRESH SALES ORDER
// =====================================================================
router.route('')
    .post(async (req: Request, res: Response) => {
        try {
            const salesService = getSalesOrderRepository(); 

            // 1. Basic Payload Validation
            if (!req.body.clientId) {
                return res.status(400).json({ message: 'Client ID is required for order generation.' });
            }

            // 2. Validate line items array structure
            if (!Array.isArray(req.body.items) || req.body.items.length === 0) {
                return res.status(400).json({ message: 'Sales Order must include at least one item line.' });
            }

            const loggedInTenantId = req.user.tenantId;

            // 3. Overwrite frontend injections and sanitize lines
            const secureSalesOrderPayload = {
                ...req.body,
                tenantId: loggedInTenantId, 
                status: req.body.status || "draft", 
                items: req.body.items.map((item: any) => {
                    const possessesProduct = item.productId !== undefined && item.productId !== null;
                    const possessesVariant = item.productVariantId !== undefined && item.productVariantId !== null;

                    if ((possessesProduct && possessesVariant) || (!possessesProduct && !possessesVariant)) {
                        throw new Error('Each line item must reference a productId OR a productVariantId, but never both.');
                    }

                    return {
                        ...item,
                        productId: possessesProduct ? item.productId : null,
                        productVariantId: possessesVariant ? item.productVariantId : null
                    };
                })
            };

            console.log('Sanitised SO Context Payload:', JSON.stringify(secureSalesOrderPayload, null, 2));

            // 4. Execute transaction logic
            const result = await salesService.createSalesOrder(secureSalesOrderPayload);
            return res.status(201).json(result); // ✅ 21 Created Status
        } catch (error: any) {
            console.error('Sales Order creation failed:', error.message || error);
            return res.status(400).json({ message: 'Sales Order creation failed: ' + error.message });
        }
    });

// =====================================================================
// PUT: MODIFY AN UNFINISHED SALES ORDER BY RESOURCE ID
// =====================================================================
router.route('/:id')
    .put(async (req: Request, res: Response) => {
        try {
            const salesService = getSalesOrderRepository(); 
            const targetSoId = parseInt(req.params.id, 10);

            // 1. Validate route path variable matching constraints
            if (isNaN(targetSoId)) {
                return res.status(400).json({ message: 'Invalid Sales Order identification tracking path.' });
            }

            // 2. Validate line items array structure
            if (!Array.isArray(req.body.items) || req.body.items.length === 0) {
                return res.status(400).json({ message: 'Sales Order updates must include at least one item line.' });
            }

            const loggedInTenantId = req.user.tenantId;

            // 3. Prevent structural data injection by stripping readonly columns
            const { id, tenantId, soNumber, ...updatableFields } = req.body;

            // 4. Sanitize updatable lines to honor table CHECK constraints
            const sanitizedItems = updatableFields.items.map((item: any) => {
                const possessesProduct = item.productId !== undefined && item.productId !== null;
                const possessesVariant = item.productVariantId !== undefined && item.productVariantId !== null;

                if ((possessesProduct && possessesVariant) || (!possessesProduct && !possessesVariant)) {
                    throw new Error('Each line item must reference a productId OR a productVariantId, but never both.');
                }

                return {
                    ...item,
                    productId: possessesProduct ? item.productId : null,
                    productVariantId: possessesVariant ? item.productVariantId : null
                };
            });

            // 5. Build clean, tenant-locked entity update payload data
            const secureUpdatePayload = {
                ...updatableFields,
                soNumber: soNumber, // Pass tracking number unchanged to search context
                tenantId: loggedInTenantId,
                items: sanitizedItems
            };

            // 6. Forward straight into service transactional persistence layer engine
            const updatedSalesOrder = await salesService.createSalesOrder(secureUpdatePayload);
            return res.status(200).json(updatedSalesOrder); // ✅ 200 OK Status
        } catch (error: any) {
            console.error('Sales Order update failed:', error.message || error);
            return res.status(400).json({ message: 'Sales Order update failed: ' + error.message });
        }
    });


    

    // =====================================================================
// DELETE: TERMINATE DRAFT OR VOID/CANCEL SUBMITTED SALES ORDER
// if it is DRAFT deletes it (hard delete)
// if it is non DRAFT cancel flag
// =====================================================================
router.route('/:id')
    .delete(async (req: Request, res: Response) => {
        try {
            const salesService = getSalesOrderRepository(); 
            const targetSoId = parseInt(req.params.id, 10);

            // 1. Validate route path variable matching constraints
            if (isNaN(targetSoId)) {
                return res.status(400).json({ message: 'Invalid Sales Order identification tracking path.' });
            }

            const loggedInTenantId = req.user.tenantId;

            // 2. Fetch the entity context using the ID to obtain the required immutable 'soNumber'
            // NOTE: Replace 'findOne' syntax or method calls to match your exact base repository usage if needed
            const salesOrderInstance = await AppDataSource.getRepository(SalesOrder).findOne({
                where: { id: targetSoId, tenantId: loggedInTenantId }
            });

            if (!salesOrderInstance) {
                return res.status(404).json({ message: `Sales Order record with identification tracking index ${targetSoId} not found.` });
            }

            // 3. Forward straight into service transactional persistence layer engine
            const operationResult = await salesService.handleDeleteOrCancelRequest(
                loggedInTenantId,
                salesOrderInstance.soNumber
            );

            // 4. Return appropriate status codes based on the service layer execution results
            // 'DELETED' returns 200 OK or 204 No Content, 'CANCELLED' returns 200 OK with the modified state payload
            return res.status(200).json(operationResult);

        } catch (error: any) {
            console.error('Sales Order removal/cancellation failed:', error.message || error);
            
            // Handle forbidden updates explicitly if thrown from service check guards
            if (error.message && error.message.includes('Forbidden') || error.message.includes('Cannot cancel')) {
                return res.status(403).json({ message: 'Action Forbidden: ' + error.message });
            }

            return res.status(400).json({ message: 'Sales Order removal execution failed: ' + error.message });
        }
    });
// =========================================================
// PATCH: SUBMIT DRAFT TO WORKFLOW (NO INVENTORY CHANGED)
// =========================================================
router.route('/:id/finalize').patch(async (req: Request, res: Response) => {
    try {
        const salesService = getSalesOrderRepository(); 
        const targetSoId = parseInt(req.params.id, 10);
        const loggedInTenantId = parseInt(req.user.tenantId, 10);

        const result = await salesService.updateSalesOrderStatus(
            targetSoId,
            loggedInTenantId,
            "PENDING_APPROVAL"
        );
        return res.status(200).json(result);
    } catch (error: any) {
        return res.status(400).json({ message: 'Submission failed: ' + error.message });
    }
});

// =========================================================
// PATCH: APPROVE PENDING SALES ORDER (DEDUCTS CURRENT STOCK)
// =========================================================
router.route('/:id/approve').patch(async (req: Request, res: Response) => {
    try {
        const salesService = getSalesOrderRepository(); 
        const targetSoId = parseInt(req.params.id, 10);
        const loggedInTenantId = parseInt(req.user.tenantId, 10);

        const result = await salesService.approvePendingSalesOrder(
            targetSoId,
            loggedInTenantId
        );
        return res.status(200).json(result);
    } catch (error: any) {
        return res.status(400).json({ message: 'Approval failed: ' + error.message });
    }
});

export default router;



 
