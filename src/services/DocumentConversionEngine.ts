import { EntityManager } from 'typeorm';
import { Quotation, QuotationStatus } from '../entity/Quotation';
import { QuotationItem } from '../entity/QuotationItem';
import { ClientRFQOrder, RFQStatus } from '../entity/ClientRFQOrder';
import { OrderSourceType, SalesOrder, SOStatus } from '../entity/SalesOrder';
import { Client_POStatus, ClientPurchaseOrder } from '../entity/ClientPurchaseOrder';
import { SalesOrderItem } from '../entity/SalesOrderItem';
import { Customer } from '../entity/Customer';

class DocumentConversionEngine {
//Pending:similarly we need to got for convertClientPOtoSalesOrder
    //-----------------------------------------------------------------
    // Client RFQ -> Quotation
    //-----------------------------------------------------------------

    async convertRFQToQuotation(
        manager: EntityManager,
        tenantId: number,
        rfqId: number,
        userId: number
    ): Promise<Quotation> {

        const rfq =
            await this.loadRFQ(
                manager,
                tenantId,
                rfqId
            );

        this.validateRFQ(rfq);

        const quotation =
            await this.createQuotationHeader(
                manager,
                tenantId,
                rfq,
                userId
            );

        await this.copyRFQLines(
            manager,
            tenantId,
            rfq,
            quotation
        );

        await this.markRFQConverted(
            manager,
            rfq
        );

        return await this.reloadQuotation(
            manager,
            quotation.id
        );
    }

                            //-----------------------------------------------------------------
                            // Private methods
                            //-----------------------------------------------------------------

                            private async loadRFQ(
                                manager: EntityManager,
                                tenantId: number,
                                rfqId: number
                            ): Promise<ClientRFQOrder> { 
                                console.log('loadRFQ.........................');
                            

                                const rfq =
                                    await manager
                                        .getRepository(ClientRFQOrder)
                                        .findOne({

                                            where: {
                                                id: rfqId,
                                                tenantId
                                            },

                                            relations: [
                                              //  "client",
                                                "items",
                                                "items.product"
                                            ]

                                        });

                                if (!rfq)
                                    throw new Error("RFQ not found.");

                                return rfq;
                            }

                            private validateRFQ(
                                rfq: ClientRFQOrder
                            ): void {

                                if (rfq.status !== RFQStatus.SENT)
                                    throw new Error(
                                        "Only SENT RFQs can be converted."
                                    );

                            }

                            private async createQuotationHeader(
                                manager: EntityManager,
                                tenantId: number,
                                rfq: ClientRFQOrder,
                                userId: number
                            ): Promise<Quotation> {

                                 const cust =  await manager.getRepository(Customer)
                                      		.findOne({
                                                      where: {
                                                              id: rfq.clientId,tenantId
                                                              },
                                                     });
                                 if (!cust) throw new Error("Client not found.");

                                         const quotation = manager.getRepository(Quotation)
                                                          .create({
                                                            
                                                                    tenantId,

                                                                    clientId: rfq.clientId,

                                                                    clientName:cust.customerName, //pending:replace by cust.customerName currently'garnage' is stored 

                                                                    contactPerson:cust.commercialContactPerson, //fill with cust.commercialContactPerson

                                                                    clientCategory: cust.customerCategoryId,

                                                                    quotationDate: new Date(),

                                                                    status: QuotationStatus.DRAFT,

                                                                    originatingClientRfqId: rfq.id,

                                                                    createdByUserId: userId

                                                                });

                                return await manager
                                    .getRepository(Quotation)
                                    .save(quotation);

                            }

                            private async copyRFQLines(
                                manager: EntityManager,
                                tenantId: number,
                                rfq: ClientRFQOrder,
                                quotation: Quotation
                            ): Promise<void> {

                                const quotationItems: QuotationItem[] = [];

                                for (const rfqItem of rfq.items) {

                                    quotationItems.push(

                                        manager
                                            .getRepository(QuotationItem)
                                            .create({

                                            //   tenantId,

                                                quotationId: quotation.id,

                                                productId: rfqItem.productId,

                                                prodName:'garbage',//Pending:Garbage

                                                unit:'garbage',//Pending:Garbage

                                                quantity: rfqItem.quantity,

                                                discount: 0

                                            })

                                    );

                                }

                                await manager
                                    .getRepository(QuotationItem)
                                    .save(quotationItems);

                            }

                            private async markRFQConverted(
                                manager: EntityManager,
                                rfq: ClientRFQOrder
                            ): Promise<void> {

                                rfq.status = RFQStatus.QUOTED;

                                await manager
                                    .getRepository(ClientRFQOrder)
                                    .save(rfq);

                            }

                            private async reloadQuotation(
                                manager: EntityManager,
                                quotationId: number
                            ): Promise<Quotation> {

                                return await manager
                                    .getRepository(Quotation)
                                    .findOneOrFail({

                                        where: {
                                            id: quotationId
                                        },

                                        relations: [
                                            "client",
                                            "items",
                                            "items.product"
                                        ]

                                    });

                            }

    //----convert clientPOtoSalesOrder
    async convertClientPOToSalesOrder(
    manager: EntityManager,
    tenantId: number,
    clientPOId: number,
    generatedSONumber: string,
    userId: number
): Promise<SalesOrder> {

    const clientPO =
        await this.loadClientPO(
            manager,
            tenantId,
            clientPOId
        );

    this.validateClientPO(clientPO);

    const salesOrder =
        await this.createSalesOrderHeader(
            manager,
            tenantId,
            clientPO,
            generatedSONumber,
            userId
        );

    await this.copyClientPOItems(
        manager,
        tenantId,
        clientPO,
        salesOrder
    );

    await this.markClientPOConverted(
        manager,
        clientPO,
        salesOrder
    );

    return await this.reloadSalesOrder(
        manager,
        salesOrder.id
    );

}

private async loadClientPO(
    manager: EntityManager,
    tenantId: number,
    clientPOId: number
): Promise<ClientPurchaseOrder> {

    const clientPO =
        await manager
            .getRepository(ClientPurchaseOrder)
            .findOne({

                where: {
                    id: clientPOId,
                    tenantId
                },

                relations: [
                    "items"
                ]

            });

    if (!clientPO)
        throw new Error("Client PO not found.");

    return clientPO;

}

     private validateClientPO(
    clientPO: ClientPurchaseOrder
): void {

    if (
        clientPO.status !== Client_POStatus.APPROVED &&
        clientPO.status !== Client_POStatus.SENT
    ) {
        throw new Error(
            "Only Approved/Sent Client PO can be converted."
        );
    }

    if (clientPO.isConvertedToSales) {

        throw new Error(

            `Client PO ${clientPO.clientPoNumber} is already converted to Sales Order ${clientPO.convertedSalesOrderNumber}.`

        );

    }

    if (
        !clientPO.items ||
        clientPO.items.length === 0
    ) {

        throw new Error(
            "Client PO has no items."
        );

    }

}

    private async createSalesOrderHeader(
    manager: EntityManager,
    tenantId: number,
    clientPO: ClientPurchaseOrder,
    generatedSONumber: string,
    userId: number
): Promise<SalesOrder> {

    const salesOrderRepo = manager.getRepository(SalesOrder);
const test: SalesOrder = new SalesOrder();
const salesOrder = salesOrderRepo.create({

                tenantId: clientPO.tenantId,

                clientId: clientPO.clientId,

                siteId: clientPO.siteId,

                soNumber: generatedSONumber,

                status: SOStatus.DRAFT,

                sourceType: OrderSourceType.CLIENT_PO,

                customerPoNumber:
                    clientPO.clientPoNumber,

                customerPoDate:
                    clientPO.poDate,

                clientPurchaseOrderId:
                    clientPO.id,

                clientPurchaseOrderNumber:
                    clientPO.clientPoNumber,

                subTotal: 0,

                taxAmount: 0,

                shippingAmount: 0,

                totalAmount: 0,

                customAttributes: null,

                createdByUserId: userId

            });

    return await manager
        .getRepository(SalesOrder)
        .save(salesOrder);

}


     private async copyClientPOItems(
    manager: EntityManager,
    tenantId: number,
    clientPO: ClientPurchaseOrder,
    salesOrder: SalesOrder
): Promise<void> {

    const salesOrderItems: SalesOrderItem[] = [];

    for (const poItem of clientPO.items) {

        salesOrderItems.push(

            manager
                .getRepository(SalesOrderItem)
                .create({

                   // tenantId,

                    salesOrderId:
                        salesOrder.id,

                    productId:
                        poItem.productId,

                    productVariantId:
                        poItem.productVariantId,

                    prodName:
                        poItem.prodName,

                    sku:
                        poItem.sku,

                    quantity:
                        poItem.quantity,

                    salesUom:
                        poItem.purchaseUom,

                    customPrice:
                        poItem.finalPrice,

                    customAttributes: null

                })

        );

    }

    await manager
        .getRepository(SalesOrderItem)
        .save(salesOrderItems);

}


    private async markClientPOConverted(
    manager: EntityManager,
    clientPO: ClientPurchaseOrder,
    salesOrder: SalesOrder
): Promise<void> {

    clientPO.internalNotes =
        (clientPO.internalNotes || "") +

        ` | Converted to Sales Order ${salesOrder.soNumber} on ${new Date().toISOString()}`;

    clientPO.isConvertedToSales = true;

    clientPO.convertedSalesOrderId =
        salesOrder.id;

    clientPO.convertedSalesOrderNumber =
        salesOrder.soNumber;

    await manager
        .getRepository(ClientPurchaseOrder)
        .save(clientPO);

}


    private async reloadSalesOrder(
    manager: EntityManager,
    salesOrderId: number
): Promise<SalesOrder> {

    return await manager
        .getRepository(SalesOrder)
        .findOneOrFail({

            where: {
                id: salesOrderId
            },

            relations: [
                "items"
            ]

        });

}

    //end clientPOtoSalesOrder                        
    //-----------------------------------------------------------------
    // Future conversions
    //-----------------------------------------------------------------

    async convertQuotationToSalesOrder(
        manager: EntityManager,
        tenantId: number,
        quotationId: number,
        userId: number
    ) {
        // TODO
    }

    async convertSalesOrderToInvoice(
        manager: EntityManager,
        tenantId: number,
        salesOrderId: number,
        userId: number
    ) {
        // TODO
    }

    async convertPurchaseRequestToPO(
        manager: EntityManager,
        tenantId: number,
        purchaseRequestId: number,
        userId: number
    ) {
        // TODO
    }

    async convertPOToGRN(
        manager: EntityManager,
        tenantId: number,
        purchaseOrderId: number,
        userId: number
    ) {
        // TODO
    }

    async convertGRNToPurchaseInvoice(
        manager: EntityManager,
        tenantId: number,
        grnId: number,
        userId: number
    ) {
        // TODO
    }




        //helper methods
        private appendAuditNote(
            existing: string | null,
            message: string
        ): string {
            return (existing || "") +
                ` | ${message} on ${new Date().toISOString()}`;
        }

        private ensureHasItems(
            items: any[] | undefined,
            documentName: string
        ): void {

            if (!items || items.length === 0) {
                throw new Error(
                    `${documentName} has no items.`
                );
            }

        }




    }

export default DocumentConversionEngine;