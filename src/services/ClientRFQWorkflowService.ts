
import { getTenantStrategyServiceRepository } from "../dependencies";
import { RFQStatus } from "../entity/ClientRFQOrder";

export enum ClientRFQWorkflowType {
    STANDARD = "STANDARD"
}

interface WorkflowNode {
    editable: boolean;
    deletable: boolean;
    customerChange: boolean;

    canConvertToQuotation: boolean;

    next: RFQStatus[];
}
export interface IClientRFQActions {
    canEdit: boolean;
    canDelete: boolean;
    canSubmit: boolean;
    canConvertToQuotation: boolean;
    canCancel: boolean;
    canClose: boolean;
}
export class ClientRFQWorkflowService {

   private workflows: Record<
    ClientRFQWorkflowType,
    Partial<Record<RFQStatus, WorkflowNode>>
> = {

    [ClientRFQWorkflowType.STANDARD]: {

        // =====================================================
        // DRAFT
        // =====================================================
        [RFQStatus.DRAFT]: {
            editable: true,
            deletable: true,
            customerChange: true,
             canConvertToQuotation: false,


            next: [
                RFQStatus.SUBMITTED
            ]
        },

        // =====================================================
        // SUBMITTED
        // =====================================================
      [RFQStatus.SUBMITTED]: {
    editable: false,
    deletable: false,
    customerChange: false,

    canConvertToQuotation: true,

    next: [
        RFQStatus.PARTIALLY_QUOTED,
        RFQStatus.QUOTED,
        RFQStatus.CANCELLED
    ]
},

        // =====================================================
        // PARTIALLY QUOTED
        // =====================================================
        [RFQStatus.PARTIALLY_QUOTED]: {
            editable: false,
            deletable: false,
            customerChange: false,
            canConvertToQuotation: false,


            next: [
                RFQStatus.QUOTED,
                RFQStatus.IN_NEGOTIATION,
                RFQStatus.CANCELLED
            ]
        },

        // =====================================================
        // QUOTED
        // =====================================================
        [RFQStatus.QUOTED]: {
            editable: false,
            deletable: false,
            customerChange: false,
            canConvertToQuotation: false,


            next: [
                RFQStatus.IN_NEGOTIATION,
                RFQStatus.CLOSED,
                RFQStatus.CANCELLED
            ]
        },

        // =====================================================
        // IN NEGOTIATION
        // =====================================================
        [RFQStatus.IN_NEGOTIATION]: {
            editable: false,
            deletable: false,
            customerChange: false,
            canConvertToQuotation: false,

            next: [
                RFQStatus.PARTIALLY_QUOTED,
                RFQStatus.QUOTED,
                RFQStatus.CANCELLED
            ]
        },

        // =====================================================
        // CLOSED
        // =====================================================
        [RFQStatus.CLOSED]: {
            editable: false,
            deletable: false,
            customerChange: false,
            canConvertToQuotation: false,

            next: []
        },

        // =====================================================
        // CANCELLED
        // =====================================================
        [RFQStatus.CANCELLED]: {
            editable: false,
            deletable: false,
            customerChange: false,
            canConvertToQuotation: false,

            next: []
        }
    }
};

public async resolveWorkflowType(
    tenantId: number
): Promise<ClientRFQWorkflowType> {

    const tenantStrategyService =
        getTenantStrategyServiceRepository();

    const strategies =
        await tenantStrategyService.getTenantStrategies(tenantId);

    const workflowStrategy =
        strategies.find(
            s => s.tenantStrategyName === 'ClientRFQ_Workflow'
        );

    if (!workflowStrategy) {
        throw new Error(
            `ClientRFQ workflow strategy is not configured for tenant ${tenantId}.`
        );
    }

    const workflowType =
        Object.values(ClientRFQWorkflowType)
            .find(
                value => value === workflowStrategy.tenantStrategy
            );

    if (!workflowType) {
        throw new Error(
            `Unsupported ClientRFQ workflow '${workflowStrategy.tenantStrategy}'.`
        );
    }

    return workflowType;
}

    // =========================================================
    // GET TENANT WORKFLOW
    // =========================================================

   private getWorkflow(
    workflowType: ClientRFQWorkflowType
): Partial<Record<RFQStatus, WorkflowNode>> {

    const workflow = this.workflows[workflowType];

    if (!workflow) {
        throw new Error(
            `Client RFQ workflow '${workflowType}' is not configured.`
        );
    }

    return workflow;
}


    // =========================================================
    // TRANSITION
    // =========================================================

    private canTransition(
    workflowType: ClientRFQWorkflowType,
    current: RFQStatus,
    next: RFQStatus
): boolean {

    const workflow =
        this.getWorkflow(workflowType);

    return workflow[current]
        ?.next
        ?.includes(next) ?? false;
}


    // =========================================================
    // EDIT
    // =========================================================

    public canEdit(
    workflowType: ClientRFQWorkflowType,
    status: RFQStatus
): boolean {

    const workflow =
        this.getWorkflow(workflowType);

    return workflow[status]?.editable ?? false;
}


    // =========================================================
    // DELETE
    // =========================================================

   public canDelete(
    workflowType: ClientRFQWorkflowType,
    status: RFQStatus
): boolean {

    const workflow =
        this.getWorkflow(workflowType);

    return workflow[status]?.deletable ?? false;
}


    // =========================================================
    // SUBMIT
    // =========================================================

    public canSubmit(
    workflowType: ClientRFQWorkflowType,
    status: RFQStatus
): boolean {

    return this.canTransition(
        workflowType,
        status,
        RFQStatus.SUBMITTED
    );
}

public canConvertToQuotation(
    workflowType: ClientRFQWorkflowType,
    status: RFQStatus,
    isConvertedToQuotation: boolean
): boolean {

    if (isConvertedToQuotation) {
        return false;
    }

    return status === RFQStatus.SUBMITTED;
}

    // =========================================================
    // CANCEL
    // =========================================================

    public canCancel(
    workflowType: ClientRFQWorkflowType,
    status: RFQStatus
): boolean {

    return this.canTransition(
        workflowType,
        status,
        RFQStatus.CANCELLED
    );
}


    // =========================================================
    // CLOSE
    // =========================================================

    public canClose(
    workflowType: ClientRFQWorkflowType,
    status: RFQStatus
): boolean {

    return this.canTransition(
        workflowType,
        status,
        RFQStatus.CLOSED
    );
}


public ensureCanTransition(
    workflowType: ClientRFQWorkflowType,
    current: RFQStatus,
    next: RFQStatus
): void {

    if (!this.canTransition(workflowType, current, next)) {
        throw new Error(
            `Client RFQ cannot transition from '${current}' to '${next}'.`
        );
    }
}

    // =========================================================
    // ENSURE EDIT
    // =========================================================

    public ensureCanEdit(
    workflowType: ClientRFQWorkflowType,
    status: RFQStatus
): void {

    if (!this.canEdit(workflowType, status)) {
        throw new Error(
            `Client RFQ cannot be edited when status is '${status}'.`
        );
    }
}

    // =========================================================
    // ENSURE DELETE
    // =========================================================

    public ensureCanDelete(
    workflowType: ClientRFQWorkflowType,
    status: RFQStatus
): void {

    if (!this.canDelete(workflowType, status)) {
        throw new Error(
            `Client RFQ cannot be deleted when status is '${status}'.`
        );
    }
}


    // =========================================================
    // ENSURE SUBMIT
    // =========================================================
public ensureCanSubmit(
    workflowType: ClientRFQWorkflowType,
    status: RFQStatus
): void {

    if (!this.canSubmit(workflowType, status)) {
        throw new Error(
            `Client RFQ cannot be submitted when status is '${status}'.`
        );
    }
}


public ensureCanMoveToNegotiation(
    workflowType: ClientRFQWorkflowType,
    status: RFQStatus
): boolean {

    if (
        !this.canTransition(
            workflowType,
            status,
            RFQStatus.IN_NEGOTIATION
        )
    ) {
        throw new Error(
            `Client RFQ cannot move from '${status}' to '${RFQStatus.IN_NEGOTIATION}' under workflow '${workflowType}'.`
        );
    }
    return true;
}

    // =========================================================
    // ENSURE CANCEL
    // =========================================================

   public ensureCanCancel(
    workflowType: ClientRFQWorkflowType,
    status: RFQStatus
): void {

    if (!this.canCancel(workflowType, status)) {
        throw new Error(
            `Client RFQ cannot be cancelled when status is '${status}'.`
        );
    }
}


    // =========================================================
    // ENSURE CLOSE
    // =========================================================

    public ensureCanClose(
    workflowType: ClientRFQWorkflowType,
    status: RFQStatus
): void {

    if (!this.canClose(workflowType, status)) {
        throw new Error(
            `Client RFQ cannot be closed when status is '${status}'.`
        );
    }
}


    // =========================================================
    // NEXT ALLOWED STATUSES
    // =========================================================

   public getNextAllowedStatuses(
    workflowType: ClientRFQWorkflowType,
    status: RFQStatus
): RFQStatus[] {

    const workflow =
        this.getWorkflow(workflowType);

    return workflow[status]?.next ?? [];
}


    // =========================================================
    // ALL ACTIONS
    // =========================================================
public getAllowedActions(
    workflowType: ClientRFQWorkflowType,
    status: RFQStatus,
    isConvertedToQuotation: boolean
): IClientRFQActions {

    return {
        canEdit: this.canEdit(
            workflowType,
            status
        ),

        canDelete: this.canDelete(
            workflowType,
            status
        ),

        canSubmit: this.canSubmit(
            workflowType,
            status
        ),

        canConvertToQuotation: this.canConvertToQuotation(
            workflowType,
            status,
            isConvertedToQuotation
        ),

        canCancel: this.canCancel(
            workflowType,
            status
        ),

        canClose: this.canClose(
            workflowType,
            status
        )
    };
}

}