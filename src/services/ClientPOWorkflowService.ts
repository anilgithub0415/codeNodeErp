import { getTenantStrategyServiceRepository } from "../dependencies";
import { Client_POStatus } from "../entity/ClientPurchaseOrder";

export enum ClientPOWorkflowType {
    STANDARD = "STANDARD"
}

 interface WorkflowNode {
    editable: boolean;
    deletable: boolean;

    canConvertToSales: boolean;

    next: Client_POStatus[];
}

export interface IClientPOActions {
    canEdit: boolean;
    canDelete: boolean;
    canSubmit: boolean;
    canApprove: boolean;
    canSend: boolean;
    canConvertToSales: boolean;
    canCancel: boolean;
    canClose: boolean;
}

export interface ClientPOWorkflowDefinition {
    initialStatus: Client_POStatus;
    nodes: Partial<Record<Client_POStatus, WorkflowNode>>;
}

export class ClientPOWorkflowService {

    private workflows: Record<
    ClientPOWorkflowType,
    ClientPOWorkflowDefinition
> = {

    [ClientPOWorkflowType.STANDARD]: {

        initialStatus: Client_POStatus.DRAFT,

        nodes: {

            [Client_POStatus.DRAFT]: {
                editable: true,
                deletable: true,
                canConvertToSales: false,

                next: [
                    Client_POStatus.PENDING_APPROVAL
                ]
            },

            //-----------------
            
            // =====================================================
            // PENDING APPROVAL
            // =====================================================
            [Client_POStatus.PENDING_APPROVAL]: {
                editable: false,
                deletable: false,
                canConvertToSales: false,

                next: [
                    Client_POStatus.APPROVED,
                    Client_POStatus.CANCELLED
                ]
            },

            // =====================================================
            // APPROVED
            // =====================================================
            [Client_POStatus.APPROVED]: {
                editable: false,
                deletable: false,
                canConvertToSales: true,

                next: [
                    Client_POStatus.SENT,
                    Client_POStatus.CANCELLED
                ]
            },

            // =====================================================
            // SENT
            // =====================================================
            [Client_POStatus.SENT]: {
                editable: false,
                deletable: false,
                canConvertToSales: true,

                next: [
                    Client_POStatus.PARTIALLY_FULFILLED,
                    Client_POStatus.FULFILLED,
                    Client_POStatus.CANCELLED
                ]
            },

            // =====================================================
            // PARTIALLY FULFILLED
            // =====================================================
            [Client_POStatus.PARTIALLY_FULFILLED]: {
                editable: false,
                deletable: false,
                canConvertToSales: false,

                next: [
                    Client_POStatus.FULFILLED,
                    Client_POStatus.CANCELLED
                ]
            },

            // =====================================================
            // FULFILLED
            // =====================================================
            [Client_POStatus.FULFILLED]: {
                editable: false,
                deletable: false,
                canConvertToSales: false,

                next: [
                    Client_POStatus.CLOSED
                ]
            },

            // =====================================================
            // CLOSED
            // =====================================================
            [Client_POStatus.CLOSED]: {
                editable: false,
                deletable: false,
                canConvertToSales: false,

                next: []
            },

            // =====================================================
            // CANCELLED
            // =====================================================
            [Client_POStatus.CANCELLED]: {
                editable: false,
                deletable: false,
                canConvertToSales: false,

                next: []
            }
        }
            //-----------------
        }
    
};

    // =========================================================
    // RESOLVE TENANT WORKFLOW
    // =========================================================

    public async resolveWorkflowType(
        tenantId: number
    ): Promise<ClientPOWorkflowType> {

        const tenantStrategyService =
            getTenantStrategyServiceRepository();

        const strategies =
            await tenantStrategyService.getTenantStrategies(
                tenantId
            );

        const workflowStrategy =
            strategies.find(
                s =>
                    s.tenantStrategyName ===
                    "ClientPO_Workflow"
            );

        if (!workflowStrategy) {
            throw new Error(
                `ClientPO workflow strategy is not configured for tenant ${tenantId}.`
            );
        }

        const workflowType =
            Object.values(ClientPOWorkflowType)
                .find(
                    value =>
                        value === workflowStrategy.tenantStrategy
                );

        if (!workflowType) {
            throw new Error(
                `Unsupported ClientPO workflow '${workflowStrategy.tenantStrategy}'.`
            );
        }

        return workflowType;
    }


    // =========================================================
    // GET WORKFLOW
    // =========================================================

    private getWorkflow(
    workflowType: ClientPOWorkflowType
): ClientPOWorkflowDefinition {

    const workflow =
        this.workflows[workflowType];

    if (!workflow) {
        throw new Error(
            `Client PO workflow '${workflowType}' is not configured.`
        );
    }

    return workflow;
}


    // =========================================================
    // TRANSITION
    // =========================================================

    private canTransition(
    workflowType: ClientPOWorkflowType,
    current: Client_POStatus,
    next: Client_POStatus
): boolean {

    const workflow =
        this.getWorkflow(workflowType);

    return workflow.nodes[current]
        ?.next
        ?.includes(next) ?? false;
}


    // =========================================================
    // EDIT
    // =========================================================

  public canEdit(
    workflowType: ClientPOWorkflowType,
    status: Client_POStatus
): boolean {

    const workflow =
        this.getWorkflow(workflowType);

    return workflow.nodes[status]?.editable ?? false;
}

    // =========================================================
    // DELETE
    // =========================================================

  public canDelete(
    workflowType: ClientPOWorkflowType,
    status: Client_POStatus
): boolean {

    const workflow =
        this.getWorkflow(workflowType);

    return workflow.nodes[status]?.deletable ?? false;
}


    // =========================================================
    // SUBMIT
    // =========================================================

    public canSubmit(
        workflowType: ClientPOWorkflowType,
        status: Client_POStatus
    ): boolean {

        return this.canTransition(
            workflowType,
            status,
            Client_POStatus.PENDING_APPROVAL
        );
    }


    // =========================================================
    // APPROVE
    // =========================================================

    public canApprove(
        workflowType: ClientPOWorkflowType,
        status: Client_POStatus
    ): boolean {

        return this.canTransition(
            workflowType,
            status,
            Client_POStatus.APPROVED
        );
    }


    // =========================================================
    // SEND
    // =========================================================

    public canSend(
        workflowType: ClientPOWorkflowType,
        status: Client_POStatus
    ): boolean {

        return this.canTransition(
            workflowType,
            status,
            Client_POStatus.SENT
        );
    }


    // =========================================================
    // CONVERT TO SALES ORDER
    // =========================================================

   public canConvertToSales(
    workflowType: ClientPOWorkflowType,
    status: Client_POStatus,
    isConvertedToSales: boolean
): boolean {

    if (isConvertedToSales) {
        return false;
    }

    const workflow =
        this.getWorkflow(workflowType);

    return workflow.nodes[status]
        ?.canConvertToSales ?? false;
}


    // =========================================================
    // CANCEL
    // =========================================================

    public canCancel(
        workflowType: ClientPOWorkflowType,
        status: Client_POStatus
    ): boolean {

        return this.canTransition(
            workflowType,
            status,
            Client_POStatus.CANCELLED
        );
    }


    // =========================================================
    // CLOSE
    // =========================================================

    public canClose(
        workflowType: ClientPOWorkflowType,
        status: Client_POStatus
    ): boolean {

        return this.canTransition(
            workflowType,
            status,
            Client_POStatus.CLOSED
        );
    }


    // =========================================================
    // ENSURE TRANSITION
    // =========================================================

    public ensureCanTransition(
        workflowType: ClientPOWorkflowType,
        current: Client_POStatus,
        next: Client_POStatus
    ): void {

        if (
            !this.canTransition(
                workflowType,
                current,
                next
            )
        ) {
            throw new Error(
                `Client PO cannot transition from '${current}' to '${next}' under workflow '${workflowType}'.`
            );
        }
    }


    // =========================================================
    // ENSURE EDIT
    // =========================================================

    public ensureCanEdit(
        workflowType: ClientPOWorkflowType,
        status: Client_POStatus
    ): void {

        if (!this.canEdit(workflowType, status)) {
            throw new Error(
                `Client PO cannot be edited when status is '${status}'.`
            );
        }
    }


    // =========================================================
    // ENSURE DELETE
    // =========================================================

    public ensureCanDelete(
        workflowType: ClientPOWorkflowType,
        status: Client_POStatus
    ): void {

        if (!this.canDelete(workflowType, status)) {
            throw new Error(
                `Client PO cannot be deleted when status is '${status}'.`
            );
        }
    }


    // =========================================================
    // ENSURE SUBMIT
    // =========================================================

    public ensureCanSubmit(
        workflowType: ClientPOWorkflowType,
        status: Client_POStatus
    ): void {

        if (!this.canSubmit(workflowType, status)) {
            throw new Error(
                `Client PO cannot be submitted when status is '${status}'.`
            );
        }
    }


    // =========================================================
    // ENSURE APPROVE
    // =========================================================

    public ensureCanApprove(
        workflowType: ClientPOWorkflowType,
        status: Client_POStatus
    ): void {

        if (!this.canApprove(workflowType, status)) {
            throw new Error(
                `Client PO cannot be approved when status is '${status}'.`
            );
        }
    }


    // =========================================================
    // ENSURE SEND
    // =========================================================

    public ensureCanSend(
        workflowType: ClientPOWorkflowType,
        status: Client_POStatus
    ): void {

        if (!this.canSend(workflowType, status)) {
            throw new Error(
                `Client PO cannot be sent when status is '${status}'.`
            );
        }
    }


    // =========================================================
    // ENSURE CONVERT TO SALES
    // =========================================================

    public ensureCanConvertToSales(
        workflowType: ClientPOWorkflowType,
        status: Client_POStatus,
        isConvertedToSales: boolean
    ): void {

        if (
            !this.canConvertToSales(
                workflowType,
                status,
                isConvertedToSales
            )
        ) {
            throw new Error(
                `Client PO cannot be converted to Sales Order when status is '${status}'.`
            );
        }
    }


    // =========================================================
    // ENSURE CANCEL
    // =========================================================

    public ensureCanCancel(
        workflowType: ClientPOWorkflowType,
        status: Client_POStatus
    ): void {

        if (!this.canCancel(workflowType, status)) {
            throw new Error(
                `Client PO cannot be cancelled when status is '${status}'.`
            );
        }
    }


    // =========================================================
    // ENSURE CLOSE
    // =========================================================

    public ensureCanClose(
        workflowType: ClientPOWorkflowType,
        status: Client_POStatus
    ): void {

        if (!this.canClose(workflowType, status)) {
            throw new Error(
                `Client PO cannot be closed when status is '${status}'.`
            );
        }
    }


    // =========================================================
    // NEXT ALLOWED STATUSES
    // =========================================================

   public getNextAllowedStatuses(
    workflowType: ClientPOWorkflowType,
    status: Client_POStatus
): Client_POStatus[] {

    const workflow =
        this.getWorkflow(workflowType);

    return workflow.nodes[status]?.next ?? [];
}

public getInitialStatus(
    workflowType: ClientPOWorkflowType
): Client_POStatus {

    return this.getWorkflow(workflowType)
        .initialStatus;
}
    // =========================================================
    // ALL ACTIONS
    // =========================================================

    public getAllowedActions(
        workflowType: ClientPOWorkflowType,
        status: Client_POStatus,
        isConvertedToSales: boolean
    ): IClientPOActions {

        return {

            canEdit:
                this.canEdit(
                    workflowType,
                    status
                ),

            canDelete:
                this.canDelete(
                    workflowType,
                    status
                ),

            canSubmit:
                this.canSubmit(
                    workflowType,
                    status
                ),

            canApprove:
                this.canApprove(
                    workflowType,
                    status
                ),

            canSend:
                this.canSend(
                    workflowType,
                    status
                ),

            canConvertToSales:
                this.canConvertToSales(
                    workflowType,
                    status,
                    isConvertedToSales
                ),

            canCancel:
                this.canCancel(
                    workflowType,
                    status
                ),
 
            canClose:
                this.canClose(
                    workflowType,
                    status
                )
        };
    }
}