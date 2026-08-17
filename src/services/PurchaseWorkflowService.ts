import express, { Request, Response } from 'express';

import { PurchaseOrder,POStatus } from '../entity/PurchaseOrder';
import { getTenantStrategyServiceRepository } from '../dependencies';

export enum PurchaseWorkflowType {
    STANDARD_APPROVAL = 'STANDARD_APPROVAL',
  //  NOSENDSTEP = 'NOSENDSTEP',
    
}

export interface IPurchaseActions {
    canEdit: boolean;
    canDelete: boolean;
    canSubmitToApprove: boolean;
    canApprove: boolean;
    canSend:boolean;
     canChangeCustomer: boolean;
}


       interface WorkflowNode {
    editable: boolean;
    deletable: boolean;
    supplierChange: boolean;
    next: POStatus[];
}

export interface PurchaseWorkflowDto {

    status: POStatus;

    editable: boolean;

    supplierChange: boolean;

    deletable: boolean;

    nextStates: POStatus[];

}

type PurchaseWorkflowDefinition =
    Partial<Record<POStatus, WorkflowNode>>;

 
export class PurchaseWorkflowService {
private workflows: Record<
    PurchaseWorkflowType,
    PurchaseWorkflowDefinition
> = {

    [PurchaseWorkflowType.STANDARD_APPROVAL]: {

        // =====================================================
        // DRAFT
        // =====================================================

        [POStatus.DRAFT]: {

            editable: true,
            deletable: true,
            supplierChange: true,

            next: [
                POStatus.PENDING_APPROVAL
            ]

        },


        // =====================================================
        // PENDING APPROVAL
        // =====================================================

        [POStatus.PENDING_APPROVAL]: {

            editable: false,
            deletable: false,
            supplierChange: false,

            next: [
                POStatus.APPROVED
            ]

        },


        // =====================================================
        // APPROVED
        // =====================================================

        [POStatus.APPROVED]: {

            editable: false,
            deletable: false,
            supplierChange: false,

            next: [
                POStatus.SENT
            ]

        },


        // =====================================================
        // SENT
        // =====================================================

        [POStatus.SENT]: {

            editable: false,
            deletable: false,
            supplierChange: false,

            next: [
                POStatus.PARTIALLY_RECEIVED,
                POStatus.RECEIVED
            ]

        },


        // =====================================================
        // PARTIALLY RECEIVED
        // =====================================================

        [POStatus.PARTIALLY_RECEIVED]: {

            editable: false,
            deletable: false,
            supplierChange: false,

            next: [
                POStatus.RECEIVED
            ]

        },


        // =====================================================
        // RECEIVED
        // =====================================================

        [POStatus.RECEIVED]: {

            editable: false,
            deletable: false,
            supplierChange: false,

            next: [
                POStatus.CLOSED
            ]

        },


        // =====================================================
        // CLOSED
        // =====================================================

        [POStatus.CLOSED]: {

            editable: false,
            deletable: false,
            supplierChange: false,

            next: []

        },


        // =====================================================
        // CANCELLED
        // =====================================================

        [POStatus.CANCELLED]: {

            editable: false,
            deletable: false,
            supplierChange: false,

            next: []

        }

    }

};

      

      private canTransition(
    workflowType: PurchaseWorkflowType,
    current: POStatus,
    next: POStatus
): boolean {

    const workflow = this.getWorkflow(workflowType);

    return workflow[current]
        ?.next
        ?.includes(next) ?? false;
}


 public canEdit(
    workflowType: PurchaseWorkflowType,
    status: POStatus
): boolean {

    const workflow = this.getWorkflow(workflowType);

    return workflow[status]?.editable ?? false;
}

public canDelete(
    workflowType: PurchaseWorkflowType,
    status: POStatus
): boolean {

    const workflow = this.getWorkflow(workflowType);

    return workflow[status]?.deletable ?? false;
}
   public canSubmitToApprove(
    workflowType: PurchaseWorkflowType,
    status: POStatus
): boolean {

    return this.canTransition(
        workflowType,
        status,
        POStatus.PENDING_APPROVAL
    );
}
    //this is sending to client

    public canApprove(
    workflowType: PurchaseWorkflowType,
    status: POStatus
): boolean {

    return this.canTransition(
        workflowType,
        status,
        POStatus.APPROVED
    );
}

    public canSend( 
        workflowType: PurchaseWorkflowType,
        status: POStatus
    ): boolean {

        return this.canTransition(
            workflowType,
            status,
            POStatus.SENT
        );
    }

   
   

    public canChangeSupplier( 
    workflowType: PurchaseWorkflowType,
    status: POStatus
): boolean {

    const workflow = this.getWorkflow(workflowType);

    return workflow[status]?.supplierChange ?? false;
}



public async resolveWorkflowType(
    tenantId: number
): Promise<PurchaseWorkflowType> {

    const tenantStrategyService =
        getTenantStrategyServiceRepository();

    const strategies =
        await tenantStrategyService.getTenantStrategies(tenantId);

    const workflowStrategy =
        strategies.find(
            s => s.tenantStrategyName === 'Purchase_Workflow'
        );

    if (!workflowStrategy) {
        throw new Error(
            `ClientRFQ workflow strategy is not configured for tenant ${tenantId}.`
        );
    }

    const workflowType =
        Object.values(PurchaseWorkflowType)
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

    private getWorkflow(
        workflowType: PurchaseWorkflowType
    ): Partial<Record<POStatus, WorkflowNode>> {

        const workflow = this.workflows[workflowType];

        if (!workflow) {
            throw new Error(
                `Purchase workflow '${workflowType}' is not configured.`
            );
        }

        return workflow;
    }

   public async getAllowedActions(    workflowType: PurchaseWorkflowType,status: POStatus): Promise< IPurchaseActions> {

    const tenantStrategyService =
        getTenantStrategyServiceRepository();

      

    return {

        canEdit: this.canEdit(workflowType,status),

        canDelete: this.canDelete(workflowType,status),

               canSubmitToApprove:this.canSubmitToApprove(workflowType,status),

        canApprove: this.canApprove(workflowType,status),

        canSend: this.canSend(workflowType,status),

     
        canChangeCustomer: this.canChangeSupplier(workflowType,status),

        

    };

}

    getNextAllowedStatuses(
    workflowType: PurchaseWorkflowType,
    status: POStatus
): POStatus[] {

    const workflow = this.getWorkflow(workflowType);

    return workflow[status]?.next ?? [];
}


      
    public ensurecanSubmitToApprove(
        workflowType: PurchaseWorkflowType,
        status: POStatus
    ): void {

        if (!this.canSubmitToApprove(workflowType, status)) {

            throw new Error(
                `Purchase cannot be submitted when status is '${status}' ` +
                `under workflow '${workflowType}'.`
            );

        }
    }

    
    public ensureCanEdit(
    workflowType: PurchaseWorkflowType,
    status: POStatus
): void {

    if (!this.canEdit(workflowType, status)) {

        throw new Error(
            `Purchase cannot be edites when status is '${status}' ` +
            `under workflow '${workflowType}'.`
        );

    }
}

    public ensureCanApprove(
    workflowType: PurchaseWorkflowType,
    status: POStatus
): void {

    if (!this.canApprove(workflowType, status)) {

        throw new Error(
            `Purchase cannot be approved when status is '${status}' ` +
            `under workflow '${workflowType}'.`
        );

    }
}


      public ensureCanSend (
    workflowType: PurchaseWorkflowType,
    status: POStatus
): void {

    if (!this.canSend(workflowType, status)) {

        throw new Error(
            `Purchase cannot be sent when status is '${status}' ` +
            `under workflow '${workflowType}'.`
        );

    }
}

    

    public ensureCanChangeCustomer(
    workflowType: PurchaseWorkflowType,
    status: POStatus
): void {

    if (!this.canChangeSupplier(workflowType, status)) {

        throw new Error(
            `Customer cannot be changed when quotation status is '${status}'.` +
            `under workflow '${workflowType}'.`
        );

    }
}

}