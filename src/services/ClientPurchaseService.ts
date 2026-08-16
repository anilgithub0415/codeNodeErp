import { EntityManager, In, QueryRunner, Repository } from 'typeorm';
import { AppDataSource } from '../../data-source'; 
import { ClientPurchaseOrder, Client_POStatus } from '../entity/ClientPurchaseOrder';
import { ClientPurchaseOrderItem } from '../entity/ClientPurchaseOrderItem';
import { Product } from '../entity/Product';
import { ProductVariant } from '../entity/productVariant';
import { DocumentSequence } from '../entity/DocumentSequence';
import { OrderSourceType, SalesOrder } from '../entity/SalesOrder';
import { SalesOrderItem } from '../entity/SalesOrderItem';
import DocumentConversionEngine from './DocumentConversionEngine';
import { getSalesOrderRepository, getTenantStrategyServiceRepository } from '../dependencies';

import {
    ClientPOWorkflowService,
    ClientPOWorkflowType,
    IClientPOActions
} from './ClientPOWorkflowService';

interface CreateClientPoDto {
    id?:number;
    tenantId: number;
    clientId: number;
    siteId: number | null;
    clientPoNumber:string;
    status: string;
    clientNotes?: string;
    requestedDeliveryDate?: Date | null;
    items: Array<{
        productId: number | null;
        productVariantId: number | null;
        quantity: number;
        purchaseUom: string | null;
    }>;
}

export interface ClientPOWorkflowDto {

    clientPoId: number;

    status: Client_POStatus;

    actions: IClientPOActions;

}

export class ClientPurchaseOrderService {
    
    private clientPoRepo!: Repository<ClientPurchaseOrder>;
   private workflowService = new ClientPOWorkflowService();

    async init(repo: Repository<ClientPurchaseOrder>): Promise<void> {
        this.clientPoRepo = repo;
        console.log("ClientPurchaseOrderService backend layer initialized successfully.");
    }
    

           public async getWorkflow(
    clientPoId: number,
    tenantId: number
): Promise<ClientPOWorkflowDto> {

    const clientPo =
        await this.clientPoRepo.findOne({

            where: {
                id: clientPoId,
                tenantId
            }

        });


    if (!clientPo) {

        throw new Error(
            "Client Purchase Order not found."
        );

    }


    const tenantStrategyService =
        getTenantStrategyServiceRepository();


    const strategies =
        await tenantStrategyService
            .getTenantStrategies(tenantId);


    const workflowStrategy =
        strategies.find(
            s =>
                s.tenantStrategyName ===
                "ClientPO_Workflow"
        );


    if (!workflowStrategy) {

        throw new Error(
            "Client Purchase Order Workflow not configured."
        );

    }


    const workflowName =
        workflowStrategy.tenantStrategy;


    const workflowType =
        this.toClientPOWorkflowType(
            workflowName
        );


    return {

        clientPoId:
            clientPo.id,

        status:
            clientPo.status,

        actions:
            await this.workflowService.getAllowedActions(
                workflowType,
                clientPo.status,clientPo.isConvertedToSales
            )

    };

}

   //helper function to map Quotation_Workflow strategy to enum
             toClientPOWorkflowType(
            value: string
        ): ClientPOWorkflowType {
        
            if (
                Object.values(ClientPOWorkflowType)
                    .includes(value as ClientPOWorkflowType)
            ) {
                return value as ClientPOWorkflowType;
            }
        
            throw new Error(
                `Unsupported ClientRFQ Workflow strategy: ${value}`
            );
        }

    async convertClientPOToSalesOrder(
    poId: number,
    tenantId: number,
    userId: number,
    manager?: EntityManager
): Promise<SalesOrder> {

    const isExternalTx =
        !!manager;

    const txManager =
        isExternalTx
            ? manager!
            : AppDataSource.manager;

    let queryRunner:
        QueryRunner | null = null;

    try {

        // =====================================================
        // 1. Create transaction when caller did not provide one
        // =====================================================

        if (!isExternalTx) {

            queryRunner =
                AppDataSource.createQueryRunner();

            await queryRunner.connect();

            await queryRunner.startTransaction();
        }


        const activeManager =
            isExternalTx
                ? txManager
                : queryRunner!.manager;


        // =====================================================
        // 2. Resolve tenant-specific Client PO workflow
        // =====================================================

        const workflowService =
            new ClientPOWorkflowService();

        const workflowType =
            await workflowService.resolveWorkflowType(
                tenantId
            );


        // =====================================================
        // 3. Fetch Client PO within tenant boundary
        // =====================================================

        const clientPoRepo =
            activeManager.getRepository(
                ClientPurchaseOrder
            );

        const existingPo =
            await clientPoRepo.findOne({
                where: {
                    id: poId,
                    tenantId
                }
            });


        if (!existingPo) {

            throw new Error(
                "Client Purchase Order record not found or unauthorized."
            );
        }


        // =====================================================
        // 4. Validate Client PO → Sales Order conversion
        // =====================================================

        workflowService.ensureCanConvertToSales(
            workflowType,
            existingPo.status,
            existingPo.isConvertedToSales
        );


        // =====================================================
        // 5. Generate Sales Order number
        // =====================================================

        const salesService =
            getSalesOrderRepository();

        const channelCode =
            "Z";

        const generatedSoNumber =
            await salesService.generateSalesOrderNumber(
                activeManager,
                channelCode
            );


        // =====================================================
        // 6. Convert Client PO → Sales Order
        // =====================================================

        const engine =
            new DocumentConversionEngine();

        const result =
            await engine.convertClientPOToSalesOrder(
                activeManager,
                tenantId,
                poId,
                generatedSoNumber,
                userId
            );


        // =====================================================
        // 7. Commit transaction
        // =====================================================

        if (!isExternalTx) {

            await queryRunner!.commitTransaction();
        }


        return result;

    }
    catch (error) {

        if (
            !isExternalTx &&
            queryRunner
        ) {

            await queryRunner.rollbackTransaction();
        }

        throw error;

    }
    finally {

        if (
            !isExternalTx &&
            queryRunner
        ) {

            await queryRunner.release();
        }
    }
}
        /* ---------------------------------------------------------
       GET SINGLE CLIENT PO FOR TENANT & ID – Aligned for Client Orders
       --------------------------------------------------------- */
    async getClientPO(
        tenantId: number,
        cpoId: number,
        manager?: EntityManager
    ): Promise<ClientPurchaseOrder[]> {
        if (!this.clientPoRepo) {
            throw new Error(
                'ClientPurchaseOrderService repository not initialized. Call init() first.'
            );
        }

        const repo = manager
            ? manager.getRepository(ClientPurchaseOrder)
            : this.clientPoRepo;

        // Fetches a specific tracking record isolated securely within the tenant space
        const orders = await repo.find({ 
            where: { tenantId, id: cpoId }, 
            relations: { items: true } 
        });
      
        return orders;
    }
    /* ---------------------------------------------------------------------
       GET CLIENT PO LIST FOR TENANT, SITE, OPTIONAL CLIENT ID & STATUSES
       --------------------------------------------------------------------- */
    async getClientPOsFiltered(
        tenantId: number,
        siteId?: number,
        clientId?: number,
        statuses?: string[], // 🚀 NEW: Added optional parameter
        includeConverted?: boolean,
        manager?: EntityManager
    ): Promise<ClientPurchaseOrder[]> {
        if (!this.clientPoRepo) {
            throw new Error('ClientPurchaseOrderService repository not initialized.');
        }

        console.log('Filtering Client Purchase Orders for Tenant:', tenantId, ' Site:', siteId, ' Client:', clientId, ' Statuses:', statuses);

        const repo = manager ? manager.getRepository(ClientPurchaseOrder) : this.clientPoRepo;

        // 1. Initialize the TypeORM conditional query block matching primary tenant indexes
        const whereConditions: any = { tenantId };

        // 2. Map structural query target arguments securely
        if (siteId !== undefined && siteId !== null && !isNaN(siteId)) {
            whereConditions.siteId = siteId;
        }

        if (clientId !== undefined && clientId !== null && !isNaN(clientId)) {
            whereConditions.clientId = clientId;
        }

        // 🚀 NEW: Dynamically map incoming statuses array using TypeORM's In operator
        if (statuses && statuses.length > 0) {
            whereConditions.status = In(statuses);
        }
        
        if (!includeConverted) {
           whereConditions.isConvertedToSales = false;
        }
        
console.log('result......',await repo.find({
            where: whereConditions,
            relations: { items: true },
            order: { id: 'DESC' } 
        }));    

        // 3. Execute find operation tracking nested line item sub-tables
        return await repo.find({
            where: whereConditions,
            relations: { items: true },
            order: { id: 'DESC' } 
        });
    }


    /* ---------------------------------------------------------
       GET ALL CLIENT POs FOR TENANT – Aligned for Client Orders
       --------------------------------------------------------- */
    async getClientPOs(
        tenantId: number,
        manager?: EntityManager
    ): Promise<ClientPurchaseOrder[]> {
        if (!this.clientPoRepo) {
            throw new Error(
                'ClientPurchaseOrderService repository not initialized. Call init() first.'
            );
        }

        const repo = manager
            ? manager.getRepository(ClientPurchaseOrder)
            : this.clientPoRepo;

        // Extracts all requisitions under the active multi-tenant workspace context safely
        const orders = await repo.find({ 
            where: { tenantId }, 
            relations: { items: true } 
        });
      
        return orders;
    }

    // Add to ClientPurchaseOrder Service
async getPOSummaryCount(
    tenantId: number,
    siteId?: number,
    clientId?: number,
    manager?: EntityManager
): Promise<Record<string, number>> {
    const repo = manager ? manager.getRepository(ClientPurchaseOrder) : this.clientPoRepo;
    
    const query = repo.createQueryBuilder('po')
        .select('po.status', 'status')
        .addSelect('COUNT(po.id)', 'count')
        .where('po.tenantId = :tenantId', { tenantId });

    if (siteId !== undefined && siteId !== null && !isNaN(siteId)) {
        query.andWhere('po.siteId = :siteId', { siteId });
    }
    if (clientId !== undefined && clientId !== null && !isNaN(clientId)) {
        query.andWhere('po.clientId = :clientId', { clientId });
    }

    const rawResults = await query.groupBy('po.status').getRawMany();
    
    // Transform array [{ status: 'DRAFT', count: '5' }] into object { DRAFT: 5 }
    return rawResults.reduce((acc, row) => {
        acc[row.status] = parseInt(row.count, 10);
        return acc;
    }, {} as Record<string, number>);
}

    /**
     * Records bare material tracking entries without altering live inventory balances.
     */
    async createClientPurchaseOrder(
    dto: CreateClientPoDto,
    manager?: EntityManager
): Promise<ClientPurchaseOrder> {

    const isExternalTx =
        !!manager;

    const txManager =
        isExternalTx
            ? manager!
            : AppDataSource.manager;

    let queryRunner:
        QueryRunner | null = null;

    try {

        // =====================================================
        // 1. Transaction
        // =====================================================

        if (!isExternalTx) {

            queryRunner =
                AppDataSource.createQueryRunner();

            await queryRunner.connect();

            await queryRunner.startTransaction();
        }


        const activeManager =
            isExternalTx
                ? txManager
                : queryRunner!.manager;


        const cpoRepo =
            activeManager.getRepository(
                ClientPurchaseOrder
            );

        const cpoiRepo =
            activeManager.getRepository(
                ClientPurchaseOrderItem
            );

        const productRepo =
            activeManager.getRepository(Product);

        const variantRepo =
            activeManager.getRepository(ProductVariant);


        // =====================================================
        // 2. Resolve tenant Client PO workflow
        // =====================================================

        const workflowService =
            new ClientPOWorkflowService();

        const workflowType =
            await workflowService.resolveWorkflowType(
                dto.tenantId
            );


        // =====================================================
        // 3. Get workflow-defined initial status
        // =====================================================

        const initialStatus =
            workflowService.getInitialStatus(
                workflowType
            );


        // =====================================================
        // 4. Generate Client PO number
        // =====================================================

        const generatedNumber =
            await this.generateInternalSequenceNumber(
                activeManager
            );


        // =====================================================
        // 5. Create Client PO header
        // =====================================================

        const parentOrder =
            cpoRepo.create({

                tenantId:
                    dto.tenantId,

                clientId:
                    dto.clientId,

                siteId:
                    dto.siteId || null,

                clientPoNumber:
                    generatedNumber,

                poDate:
                    new Date(),

                requestedDeliveryDate:
                    dto.requestedDeliveryDate || null,

                status:
                    initialStatus,

                totalAmount:
                    0.00,

                clientNotes:
                    dto.clientNotes || '',

                internalNotes:
                    `Generated by site workflow automation routing.`
            });


   const savedParent =
    await cpoRepo.save<ClientPurchaseOrder>(
        parentOrder
    );

        const enrichedItems:
            ClientPurchaseOrderItem[] = [];


        // =====================================================
        // 6. Build PO line items
        // =====================================================

        for (
            const itemInput of dto.items
        ) {

            const lineItem =
                cpoiRepo.create();

            lineItem.clientPurchaseOrderId =
                savedParent.id;

            lineItem.clientPurchaseOrder =
                savedParent;

            lineItem.quantity =
                Number(
                    itemInput.quantity || 1
                );

            lineItem.finalPrice =
                0.00;


            let chosenUom =
                itemInput.purchaseUom?.trim();


            // =================================================
            // Product
            // =================================================

            if (
                itemInput.productId &&
                !itemInput.productVariantId
            ) {

                const product =
                    await productRepo.findOne({
                        where: {
                            id: itemInput.productId,
                            tenantId: dto.tenantId
                        }
                    });


                if (!product) {

                    throw new Error(
                        `Material Product ID ${itemInput.productId} not found.`
                    );
                }


                if (!chosenUom) {

                    chosenUom =
                        product.defaultPurchaseUom ||
                        product.baseUom ||
                        'PCS';
                }


                lineItem.productId =
                    product.id;

                lineItem.productVariantId =
                    null;

                lineItem.prodName =
                    product.prodName;

                lineItem.sku =
                    product.sku;

                lineItem.purchaseUom =
                    chosenUom;
            }


            // =================================================
            // Product Variant
            // =================================================

            else if (
                itemInput.productVariantId &&
                !itemInput.productId
            ) {

                const variant =
                    await variantRepo.findOne({
                        where: {
                            id: itemInput.productVariantId
                        },
                        relations: [
                            'productTemplate'
                        ]
                    });


                if (
                    !variant ||
                    variant.productTemplate.tenantId !==
                        dto.tenantId
                ) {

                    throw new Error(
                        `Material Variant ID ${itemInput.productVariantId} not found.`
                    );
                }


                if (!chosenUom) {

                    chosenUom =
                        variant.productTemplate.defaultPurchaseUom ||
                        variant.productTemplate.baseUom ||
                        'PCS';
                }


                const sizeStr =
                    variant.size
                        ? ` (${variant.size})`
                        : '';

                const finishStr =
                    variant.finish
                        ? ` - ${variant.finish}`
                        : '';


                lineItem.productId =
                    null;

                lineItem.productVariantId =
                    variant.id;

                lineItem.prodName =
                    `${variant.productTemplate.prodName}${sizeStr}${finishStr}`;

                lineItem.sku =
                    variant.sku;

                lineItem.purchaseUom =
                    chosenUom;
            }


            // =================================================
            // Free-text item
            // =================================================

            else {

                lineItem.productId =
                    null;

                lineItem.productVariantId =
                    null;

                lineItem.prodName =
                    (itemInput as any).prodName ||
                    'Free-text Product Entry';

                lineItem.sku =
                    (itemInput as any).sku ||
                    null;

                lineItem.purchaseUom =
                    chosenUom ||
                    'PCS';
            }


            enrichedItems.push(
                lineItem
            );
        }


        // =====================================================
        // 7. Save PO items
        // =====================================================

        await cpoiRepo.save(
            enrichedItems
        );


        savedParent.items =
            enrichedItems;


        // =====================================================
        // 8. Commit
        // =====================================================

        if (
            !isExternalTx &&
            queryRunner
        ) {

            await queryRunner.commitTransaction();
        }


        // =====================================================
        // 9. Remove circular entity reference
        // =====================================================

        if (savedParent.items) {

            for (
                const item of savedParent.items
            ) {

                delete (
                    item as any
                ).clientPurchaseOrder;
            }
        }


        return savedParent;

    }
    catch (error) {

        if (
            !isExternalTx &&
            queryRunner
        ) {

            await queryRunner.rollbackTransaction();
        }

        throw error;

    }
    finally {

        if (
            !isExternalTx &&
            queryRunner
        ) {

            await queryRunner.release();
        }
    }
}
/**
 * Strict PUT/PATCH Action: Manages modifications, item purging, and state mutations
 * like transitioning from DRAFT to PENDING_APPROVAL.
 */
async updateClientPurchaseOrder(
    id: number,
    tenantId: number,
    updateDto: Partial<CreateClientPoDto> & { status?: Client_POStatus },
    manager?: EntityManager
): Promise<ClientPurchaseOrder> {

    console.log(
        'm in updateClientPurchaseOrder....................................'
    );

    const isExternalTx = !!manager;
    const txManager = isExternalTx
        ? manager!
        : AppDataSource.manager;

    let queryRunner: any = null;

    let enrichedItems: ClientPurchaseOrderItem[] = [];

    try {

        if (!isExternalTx) {
            queryRunner = AppDataSource.createQueryRunner();

            await queryRunner.connect();
            await queryRunner.startTransaction();
        }

        const activeManager =
            isExternalTx
                ? txManager
                : queryRunner.manager;

        const cpoRepo =
            activeManager.getRepository(ClientPurchaseOrder);

        const cpoiRepo =
            activeManager.getRepository(ClientPurchaseOrderItem);

        const productRepo =
            activeManager.getRepository(Product);

        const variantRepo =
            activeManager.getRepository(ProductVariant);


        // =====================================================
        // 1. MULTI-TENANT BOUNDARY CHECK
        // =====================================================

        const existingPo =
            await cpoRepo.findOne({
                where: {
                    id,
                    tenantId
                }
            });

        if (!existingPo) {
            throw new Error(
                "Client Purchase Order record not found or unauthorized."
            );
        }


        // =====================================================
        // 2. RESOLVE TENANT CLIENT PO WORKFLOW
        // =====================================================

        const workflowService =
            new ClientPOWorkflowService();

        const workflowType =
            await workflowService.resolveWorkflowType(
                tenantId
            );


        // =====================================================
        // 3. CHECK WHETHER CURRENT PO CAN BE EDITED
        // =====================================================

        workflowService.ensureCanEdit(
            workflowType,
            existingPo.status
        );


        // =====================================================
        // 4. HANDLE INCOMING ITEMS
        // =====================================================

        if (
            updateDto.items &&
            updateDto.items.length > 0
        ) {

            // Delete existing items first
            await cpoiRepo.delete({
                clientPurchaseOrderId: existingPo.id
            });


            for (const itemInput of updateDto.items) {

                const lineItem =
                    cpoiRepo.create();

                lineItem.clientPurchaseOrderId =
                    existingPo.id;

                lineItem.clientPurchaseOrder =
                    existingPo;

                lineItem.quantity =
                    Number(itemInput.quantity || 1);

                lineItem.finalPrice = 0.00;


                let chosenUom =
                    itemInput.purchaseUom?.trim();


                // =================================================
                // PRODUCT
                // =================================================

                if (
                    itemInput.productId &&
                    !itemInput.productVariantId
                ) {

                    const product =
                        await productRepo.findOne({
                            where: {
                                id: itemInput.productId,
                                tenantId
                            }
                        });

                    if (!product) {
                        throw new Error(
                            `Material Product ID ${itemInput.productId} not found.`
                        );
                    }


                    if (!chosenUom) {
                        chosenUom =
                            product.defaultPurchaseUom ||
                            product.baseUom ||
                            'PCS';
                    }


                    lineItem.productId =
                        product.id;

                    lineItem.productVariantId =
                        null;

                    lineItem.prodName =
                        product.prodName;

                    lineItem.sku =
                        product.sku;

                    lineItem.purchaseUom =
                        chosenUom;


                // =================================================
                // PRODUCT VARIANT
                // =================================================

                } else if (
                    itemInput.productVariantId &&
                    !itemInput.productId
                ) {

                    const variant =
                        await variantRepo.findOne({
                            where: {
                                id:
                                    itemInput.productVariantId
                            },
                            relations: [
                                'productTemplate'
                            ]
                        });


                    if (
                        !variant ||
                        variant.productTemplate.tenantId !==
                            tenantId
                    ) {

                        throw new Error(
                            `Material Variant ID ${itemInput.productVariantId} not found.`
                        );
                    }


                    if (!chosenUom) {

                        chosenUom =
                            variant
                                .productTemplate
                                .defaultPurchaseUom ||
                            variant
                                .productTemplate
                                .baseUom ||
                            'PCS';
                    }


                    const sizeStr =
                        variant.size
                            ? ` (${variant.size})`
                            : '';

                    const finishStr =
                        variant.finish
                            ? ` - ${variant.finish}`
                            : '';


                    lineItem.productId =
                        null;

                    lineItem.productVariantId =
                        variant.id;

                    lineItem.prodName =
                        `${variant.productTemplate.prodName}${sizeStr}${finishStr}`;

                    lineItem.sku =
                        variant.sku;

                    lineItem.purchaseUom =
                        chosenUom;
                }


                enrichedItems.push(lineItem);
            }


            await cpoiRepo.save(
                enrichedItems
            );

            existingPo.items =
                enrichedItems;
        }


        // =====================================================
        // 5. REMOVE CONTROL FIELDS FROM HEADER UPDATE
        // =====================================================

        const {
            id: payloadId,
            tenantId: payloadTenantId,
            clientPoNumber,
            items: rawItems,
            status,
            ...updatableFields
        } = updateDto;


        // =====================================================
        // 6. APPLY NORMAL HEADER CHANGES
        // =====================================================

        cpoRepo.merge(
            existingPo,
            updatableFields
        );


        if (enrichedItems.length > 0) {
            existingPo.items =
                enrichedItems;
        }


        // =====================================================
        // 7. HANDLE WORKFLOW STATUS TRANSITION
        // =====================================================

        if (status) {

            // Do not silently accept same status as a transition.
            if (status !== existingPo.status) {

                workflowService.ensureCanTransition(
                    workflowType,
                    existingPo.status,
                    status
                );

                existingPo.status =
                    status;


                // ---------------------------------------------
                // SUBMISSION
                // ---------------------------------------------

                if (
                    status ===
                    Client_POStatus.PENDING_APPROVAL
                ) {

                    const finalItemCount =
                        await cpoiRepo.count({
                            where: {
                                clientPurchaseOrderId:
                                    existingPo.id
                            }
                        });


                    if (
                        finalItemCount === 0 &&
                        (
                            !existingPo.items ||
                            existingPo.items.length === 0
                        )
                    ) {

                        throw new Error(
                            "Cannot submit an empty Purchase Order for approval."
                        );
                    }


                    existingPo.internalNotes +=
                        ` | Submitted for approval on ${new Date().toISOString()}`;
                }
            }
        }


        // =====================================================
        // 8. SAVE
        // =====================================================

        const targetOrder =
            await cpoRepo.save(
                existingPo
            );


        // =====================================================
        // 9. COMMIT
        // =====================================================

        if (
            !isExternalTx &&
            queryRunner
        ) {
            await queryRunner.commitTransaction();
        }


        // =====================================================
        // 10. REMOVE CIRCULAR REFERENCE
        // =====================================================

        if (targetOrder.items) {

            for (
                const item
                of targetOrder.items
            ) {

                delete (
                    item as any
                ).clientPurchaseOrder;
            }
        }


        return targetOrder;


    } catch (error) {

        if (
            !isExternalTx &&
            queryRunner
        ) {
            await queryRunner.rollbackTransaction();
        }

        throw error;


    } finally {

        if (
            !isExternalTx &&
            queryRunner
        ) {
            await queryRunner.release();
        }
    }
}


//Note/Protocol:Here ClientPurchaseorder is straiht way deleted if its not SENT yet means if DRAFT/PENDING_APPROVAL/APPROVED
//1Aug2026
async handleDeleteOrCancelClientRequest(
    tenantId: number,
    clientPoNumber: string,
    manager?: EntityManager
): Promise<{
    success: boolean;
    action: 'DELETED' | 'CANCELLED';
}> {

    const isExternalTransaction =
        !!manager;

    const txManager =
        isExternalTransaction
            ? manager!
            : AppDataSource.manager;

    let queryRunner:
        QueryRunner | null = null;

    try {

        // =====================================================
        // 1. Create transaction when caller did not provide one
        // =====================================================

        if (!isExternalTransaction) {

            queryRunner =
                AppDataSource.createQueryRunner();

            await queryRunner.connect();

            await queryRunner.startTransaction();
        }


        const activeManager =
            isExternalTransaction
                ? txManager
                : queryRunner!.manager;


        const clientPoRepo =
            activeManager.getRepository(
                ClientPurchaseOrder
            );


        // =====================================================
        // 2. Resolve tenant-specific workflow
        // =====================================================

        const workflowService =
            new ClientPOWorkflowService();

        const workflowType =
            await workflowService.resolveWorkflowType(
                tenantId
            );


        // =====================================================
        // 3. Fetch Client PO within tenant boundary
        // =====================================================

        const existingOrder =
            await clientPoRepo.findOne({
                where: {
                    tenantId,
                    clientPoNumber
                },
                relations: ['items']
            });


        if (!existingOrder) {

            throw new Error(
                `[ClientPurchaseService] Client Purchase Order not found for Number: ${clientPoNumber}`
            );
        }


        // =====================================================
        // 4. DRAFT → DELETE
        // =====================================================

        if (
            existingOrder.status ===
            Client_POStatus.DRAFT
        ) {

            workflowService.ensureCanDelete(
                workflowType,
                existingOrder.status
            );


            console.log(
                `[ClientPurchaseService] Deleting DRAFT Client PO: ${existingOrder.clientPoNumber}`
            );


            await clientPoRepo.remove(
                existingOrder
            );


            if (
                !isExternalTransaction &&
                queryRunner
            ) {
                await queryRunner.commitTransaction();
            }


            return {
                success: true,
                action: 'DELETED'
            };
        }


        // =====================================================
        // 5. All non-DRAFT requests → CANCEL
        // =====================================================

        workflowService.ensureCanCancel(
            workflowType,
            existingOrder.status
        );


        console.log(
            `[ClientPurchaseService] Cancelling Client PO: ${existingOrder.clientPoNumber}`
        );


        existingOrder.status =
            Client_POStatus.CANCELLED;


        await clientPoRepo.save(
            existingOrder
        );


        // =====================================================
        // 6. Commit transaction
        // =====================================================

        if (
            !isExternalTransaction &&
            queryRunner
        ) {
            await queryRunner.commitTransaction();
        }


        return {
            success: true,
            action: 'CANCELLED'
        };

    }
    catch (error) {

        if (
            !isExternalTransaction &&
            queryRunner
        ) {
            await queryRunner.rollbackTransaction();
        }

        throw error;

    }
    finally {

        if (
            !isExternalTransaction &&
            queryRunner
        ) {
            await queryRunner.release();
        }
    }
}
async processPoApproval(
    id: number,
    tenantId: number,
    action: 'APPROVE' | 'REJECT',
    updatedItems?: any[]
): Promise<ClientPurchaseOrder> {

    const queryRunner = AppDataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {

        const activeManager = queryRunner.manager;

        const cpoRepo =
            activeManager.getRepository(ClientPurchaseOrder);

        const cpoiRepo =
            activeManager.getRepository(ClientPurchaseOrderItem);

        const productRepo =
            activeManager.getRepository(Product);

        const variantRepo =
            activeManager.getRepository(ProductVariant);


        // =====================================================
        // 1. Resolve tenant-specific Client PO workflow
        // =====================================================

        const workflowService =
            new ClientPOWorkflowService();

        const workflowType =
            await workflowService.resolveWorkflowType(
                tenantId
            );


        // =====================================================
        // 2. Fetch Client PO within tenant boundary
        // =====================================================

        const existingPo =
            await cpoRepo.findOne({
                where: {
                    id,
                    tenantId
                },
                relations: ['items']
            });

        if (!existingPo) {
            throw new Error(
                "Client Purchase Order record not found or unauthorized."
            );
        }


        // =====================================================
        // 3. Resolve requested workflow transition
        // =====================================================

        const nextStatus =
            action === 'APPROVE'
                ? Client_POStatus.APPROVED
                : Client_POStatus.CANCELLED;


        // =====================================================
        // 4. Workflow transition validation
        // =====================================================

        workflowService.ensureCanTransition(
            workflowType,
            existingPo.status,
            nextStatus
        );


        // =====================================================
        // 5. Mutate lines only when approving
        // =====================================================

        if (
            action === 'APPROVE' &&
            updatedItems &&
            updatedItems.length > 0
        ) {

            // Delete original line records
            await cpoiRepo.delete({
                clientPurchaseOrderId:
                    existingPo.id
            });


            const enrichedItems:
                ClientPurchaseOrderItem[] = [];


            for (const itemInput of updatedItems) {

                const lineItem =
                    cpoiRepo.create();

                lineItem.clientPurchaseOrderId =
                    existingPo.id;

                lineItem.clientPurchaseOrder =
                    existingPo;

                lineItem.quantity =
                    Number(itemInput.quantity || 1);

                lineItem.finalPrice = 0.00;


                let chosenUom =
                    itemInput.purchaseUom?.trim();


                // =================================================
                // Product
                // =================================================

                if (
                    itemInput.productId &&
                    !itemInput.productVariantId
                ) {

                    const product =
                        await productRepo.findOne({
                            where: {
                                id: itemInput.productId,
                                tenantId
                            }
                        });

                    if (!product) {
                        throw new Error(
                            `Material Product ID ${itemInput.productId} not found.`
                        );
                    }


                    if (!chosenUom) {
                        chosenUom =
                            product.defaultPurchaseUom ||
                            product.baseUom ||
                            'PCS';
                    }


                    lineItem.productId =
                        product.id;

                    lineItem.productVariantId =
                        null;

                    lineItem.prodName =
                        product.prodName;

                    lineItem.sku =
                        product.sku;

                    lineItem.purchaseUom =
                        chosenUom;

                }


                // =================================================
                // Product Variant
                // =================================================

                else if (
                    itemInput.productVariantId &&
                    !itemInput.productId
                ) {

                    const variant =
                        await variantRepo.findOne({
                            where: {
                                id:
                                    itemInput.productVariantId
                            },
                            relations: [
                                'productTemplate'
                            ]
                        });


                    if (
                        !variant ||
                        variant.productTemplate.tenantId !==
                            tenantId
                    ) {

                        throw new Error(
                            `Material Variant ID ${itemInput.productVariantId} not found.`
                        );
                    }


                    if (!chosenUom) {
                        chosenUom =
                            variant
                                .productTemplate
                                .defaultPurchaseUom ||
                            variant
                                .productTemplate
                                .baseUom ||
                            'PCS';
                    }


                    const sizeStr =
                        variant.size
                            ? ` (${variant.size})`
                            : '';

                    const finishStr =
                        variant.finish
                            ? ` - ${variant.finish}`
                            : '';


                    lineItem.productId =
                        null;

                    lineItem.productVariantId =
                        variant.id;

                    lineItem.prodName =
                        `${variant.productTemplate.prodName}${sizeStr}${finishStr}`;

                    lineItem.sku =
                        variant.sku;

                    lineItem.purchaseUom =
                        chosenUom;
                }


                enrichedItems.push(lineItem);
            }


            await cpoiRepo.save(
                enrichedItems
            );

            existingPo.items =
                enrichedItems;
        }


        // =====================================================
        // 6. Apply workflow-approved transition
        // =====================================================

        existingPo.status =
            nextStatus;


        // =====================================================
        // 7. Save Client PO
        // =====================================================

        await cpoRepo.save(
            existingPo
        );


        // =====================================================
        // 8. Reload clean entity
        // =====================================================

        const cleanPo =
            await cpoRepo.findOne({
                where: {
                    id: existingPo.id,
                    tenantId
                },
                relations: ['items']
            });


        if (!cleanPo) {
            throw new Error(
                "Failed to reload processed Purchase Order."
            );
        }


        // =====================================================
        // 9. Commit transaction
        // =====================================================

        await queryRunner.commitTransaction();


        return cleanPo;

    }
    catch (error: any) {

        await queryRunner.rollbackTransaction();

        console.error(
            '[CPO Service Workflow Rollback Failure]:',
            error.message || error
        );

        throw error;

    }
    finally {

        await queryRunner.release();

    }
}
async processPoDispatch(
    id: number,
    tenantId: number,
    action: 'SENT',
    updatedItems?: any[]
): Promise<ClientPurchaseOrder> {

    const queryRunner =
        AppDataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {

        const activeManager =
            queryRunner.manager;

        const cpoRepo =
            activeManager.getRepository(
                ClientPurchaseOrder
            );

        const cpoiRepo =
            activeManager.getRepository(
                ClientPurchaseOrderItem
            );

        const productRepo =
            activeManager.getRepository(
                Product
            );

        const variantRepo =
            activeManager.getRepository(
                ProductVariant
            );


        // =====================================================
        // 1. Resolve tenant-specific Client PO workflow
        // =====================================================

        const workflowService =
            new ClientPOWorkflowService();

        const workflowType =
            await workflowService.resolveWorkflowType(
                tenantId
            );


        // =====================================================
        // 2. Fetch Client PO within tenant boundary
        // =====================================================

        const existingPo =
            await cpoRepo.findOne({
                where: {
                    id,
                    tenantId
                },
                relations: ['items']
            });

        if (!existingPo) {
            throw new Error(
                "Client Purchase Order record not found or unauthorized."
            );
        }


        // =====================================================
        // 3. Validate SENT transition through workflow
        // =====================================================

        workflowService.ensureCanSend(
            workflowType,
            existingPo.status
        );


        // =====================================================
        // 4. Mutate lines if sender submitted
        //    altered item quantities
        // =====================================================

        if (
            updatedItems &&
            updatedItems.length > 0
        ) {

            // Delete existing line records
            await cpoiRepo.delete({
                clientPurchaseOrderId:
                    existingPo.id
            });


            const enrichedItems:
                ClientPurchaseOrderItem[] = [];


            for (const itemInput of updatedItems) {

                const lineItem =
                    cpoiRepo.create();

                lineItem.clientPurchaseOrderId =
                    existingPo.id;

                lineItem.clientPurchaseOrder =
                    existingPo;

                lineItem.quantity =
                    Number(
                        itemInput.quantity || 1
                    );

                lineItem.finalPrice =
                    0.00;


                let chosenUom =
                    itemInput.purchaseUom?.trim();


                // =================================================
                // Product
                // =================================================

                if (
                    itemInput.productId &&
                    !itemInput.productVariantId
                ) {

                    const product =
                        await productRepo.findOne({
                            where: {
                                id:
                                    itemInput.productId,
                                tenantId
                            }
                        });


                    if (!product) {
                        throw new Error(
                            `Material Product ID ${itemInput.productId} not found.`
                        );
                    }


                    if (!chosenUom) {
                        chosenUom =
                            product.defaultPurchaseUom ||
                            product.baseUom ||
                            'PCS';
                    }


                    lineItem.productId =
                        product.id;

                    lineItem.productVariantId =
                        null;

                    lineItem.prodName =
                        product.prodName;

                    lineItem.sku =
                        product.sku;

                    lineItem.purchaseUom =
                        chosenUom;

                }


                // =================================================
                // Product Variant
                // =================================================

                else if (
                    itemInput.productVariantId &&
                    !itemInput.productId
                ) {

                    const variant =
                        await variantRepo.findOne({
                            where: {
                                id:
                                    itemInput.productVariantId
                            },
                            relations: [
                                'productTemplate'
                            ]
                        });


                    if (
                        !variant ||
                        variant.productTemplate.tenantId !==
                            tenantId
                    ) {

                        throw new Error(
                            `Material Variant ID ${itemInput.productVariantId} not found.`
                        );
                    }


                    if (!chosenUom) {
                        chosenUom =
                            variant
                                .productTemplate
                                .defaultPurchaseUom ||
                            variant
                                .productTemplate
                                .baseUom ||
                            'PCS';
                    }


                    const sizeStr =
                        variant.size
                            ? ` (${variant.size})`
                            : '';

                    const finishStr =
                        variant.finish
                            ? ` - ${variant.finish}`
                            : '';


                    lineItem.productId =
                        null;

                    lineItem.productVariantId =
                        variant.id;

                    lineItem.prodName =
                        `${variant.productTemplate.prodName}${sizeStr}${finishStr}`;

                    lineItem.sku =
                        variant.sku;

                    lineItem.purchaseUom =
                        chosenUom;
                }


                enrichedItems.push(
                    lineItem
                );
            }


            await cpoiRepo.save(
                enrichedItems
            );

            existingPo.items =
                enrichedItems;
        }


        // =====================================================
        // 5. Apply workflow-approved transition
        // =====================================================

        if (action === 'SENT') {

            existingPo.status =
                Client_POStatus.SENT;


            // Future integration point:
            //
            // await this.transmitPoToExternalVendor(
            //     existingPo,
            //     queryRunner.manager
            // );
        }


        // =====================================================
        // 6. Save Client PO
        // =====================================================

        await cpoRepo.save(
            existingPo
        );


        // =====================================================
        // 7. Reload clean entity
        // =====================================================

        const cleanPo =
            await cpoRepo.findOne({
                where: {
                    id: existingPo.id,
                    tenantId
                },
                relations: ['items']
            });


        if (!cleanPo) {
            throw new Error(
                "Failed to reload processed Purchase Order."
            );
        }


        // =====================================================
        // 8. Commit transaction
        // =====================================================

        await queryRunner.commitTransaction();


        return cleanPo;

    }
    catch (error: any) {

        await queryRunner.rollbackTransaction();

        console.error(
            '[CPO Service Dispatch Rollback Failure]:',
            error.message || error
        );

        throw error;

    }
    finally {

        await queryRunner.release();

    }
}


    /**
     * Builds sequential tracking strings using a pessimistic database row lock.
     */
    private async generateInternalSequenceNumber(transactionalEntityManager: EntityManager): Promise<string> {
        const now = new Date();
        const yearMonth = `${now.getFullYear().toString().slice(-2)}${(now.getMonth() + 1).toString().padStart(2, '0')}`;
        const docType = "CLIENT_REQ_PO";

        let sequence = await transactionalEntityManager
            .getRepository(DocumentSequence)
            .createQueryBuilder("seq")
            .setLock("pessimistic_write")
            .where("seq.documentType = :docType AND seq.prefixYearMonth = :yearMonth", { docType, yearMonth })
            .getOne();

        let nextValue: number;

        if (!sequence) {
            nextValue = 100001;
            const newSequence = new DocumentSequence();
            newSequence.documentType = docType;
            newSequence.prefixYearMonth = yearMonth;
            newSequence.currentValue = nextValue;
            await transactionalEntityManager.save(DocumentSequence, newSequence);
        } else {
            nextValue = sequence.currentValue + 1;
            sequence.currentValue = nextValue;
            await transactionalEntityManager.save(DocumentSequence, sequence);
        }

        return `CPO-${yearMonth}-${nextValue}`;
    }

    private async generateSalesOrderNumber(
    transactionalEntityManager: EntityManager
): Promise<string> {

    const now = new Date();

    const yearMonth =
        `${now.getFullYear().toString().slice(-2)}${(now.getMonth() + 1)
            .toString()
            .padStart(2, '0')}`;

    const docType = "SALES_ORDER";

    let sequence = await transactionalEntityManager
        .getRepository(DocumentSequence)
        .createQueryBuilder("seq")
        .setLock("pessimistic_write")
        .where(
            "seq.documentType = :docType AND seq.prefixYearMonth = :yearMonth",
            { docType, yearMonth }
        )
        .getOne();

    let nextValue: number;

    if (!sequence) {

        nextValue = 100001;

        const newSequence = new DocumentSequence();

        newSequence.documentType = docType;
        newSequence.prefixYearMonth = yearMonth;
        newSequence.currentValue = nextValue;

        await transactionalEntityManager.save(DocumentSequence, newSequence);

    } else {

        nextValue = sequence.currentValue + 1;

        sequence.currentValue = nextValue;

        await transactionalEntityManager.save(DocumentSequence, sequence);
    }

    return `SO-${yearMonth}-${nextValue}`;
}

}

export default ClientPurchaseOrderService