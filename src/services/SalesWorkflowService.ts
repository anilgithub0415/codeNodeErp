import express, { Request, Response } from 'express';

import { SalesOrder,SOStatus } from '../entity/SalesOrder';
import { getTenantStrategyServiceRepository } from '../dependencies';

export enum SalesWorkflowType {
    STANDARD_APPROVAL = 'STANDARD_APPROVAL',
  //  NOSENDSTEP = 'NOSENDSTEP',
    
}
export interface ISalesActions {

    canEdit: boolean;
    canDelete: boolean;

    canSubmitToApprove: boolean;
    canApprove: boolean;
    canSend: boolean;

    canChangeCustomer: boolean;

    nextStates: SOStatus[];
}
       interface WorkflowNode {
    editable: boolean;
    deletable: boolean;
    customerChange: boolean;
    next: SOStatus[];
}

export interface SalesWorkflowDto {

    status: SOStatus;

    editable: boolean;

    customerChange: boolean;

    deletable: boolean;

    nextStates: SOStatus[];

}

type SalesWorkflowDefinition =
    Partial<Record<SOStatus, WorkflowNode>>;

 
export class SalesWorkflowService {

    
private workflows: Record<SalesWorkflowType, SalesWorkflowDefinition> = {

  [SalesWorkflowType.STANDARD_APPROVAL]: {
    [SOStatus.DRAFT]: {
        editable: true,
        deletable: true,
        customerChange: true,
        next: [
            SOStatus.PENDING_APPROVAL
        ]
    },

    [SOStatus.PENDING_APPROVAL]: {
    editable: false,
    deletable: false,
    customerChange: false,
    next: [
        SOStatus.APPROVED
    ]
    },

    [SOStatus.APPROVED]: {
        editable: false,
        deletable: false,
        customerChange: false,
        next: [
            SOStatus.SENT
        ]
    },

    [SOStatus.SENT]: {
        editable: false,
        deletable: false,
        customerChange: false,
        next: [
            SOStatus.PARTIALLY_DELIVERED,
            SOStatus.DELIVERED
        ]
    },

    [SOStatus.PARTIALLY_DELIVERED]: {
    editable: false,
    deletable: false,
    customerChange: false,
    next: [
        SOStatus.DELIVERED
    ]
},

[SOStatus.DELIVERED]: {
    editable: false,
    deletable: false,
    customerChange: false,
    next: [
        SOStatus.CLOSED
    ]
},

   [SOStatus.CLOSED]: {
    editable: false,
    deletable: false,
    customerChange: false,
    next: []
},

[SOStatus.CANCELLED]: {
    editable: false,
    deletable: false,
    customerChange: false,
    next: []
},
} //end of STANDARD_APPROVAL

};

      

      private canTransition(
    workflowType: SalesWorkflowType,
    current: SOStatus,
    next: SOStatus
): boolean {

    const workflow = this.getWorkflow(workflowType);

    return workflow[current]
        ?.next
        ?.includes(next) ?? false;
}


 public canEdit(
    workflowType: SalesWorkflowType,
    status: SOStatus
): boolean {

    const workflow = this.getWorkflow(workflowType);

    return workflow[status]?.editable ?? false;
}

public canDelete(
    workflowType: SalesWorkflowType,
    status: SOStatus
): boolean {

    const workflow = this.getWorkflow(workflowType);

    return workflow[status]?.deletable ?? false;
}
   public canSubmitToApprove(
    workflowType: SalesWorkflowType,
    status: SOStatus
): boolean {

    return this.canTransition(
        workflowType,
        status,
        SOStatus.PENDING_APPROVAL
    );
}
    //this is sending to client

    public canApprove(
    workflowType: SalesWorkflowType,
    status: SOStatus
): boolean {

    return this.canTransition(
        workflowType,
        status,
        SOStatus.APPROVED
    );
}

    public canSend( 
        workflowType: SalesWorkflowType,
        status: SOStatus
    ): boolean {

        return this.canTransition(
            workflowType,
            status,
            SOStatus.SENT
        );
    }

  


 

    public canChangeCustomer( 
    workflowType: SalesWorkflowType,
    status: SOStatus
): boolean {

    const workflow = this.getWorkflow(workflowType);

    return workflow[status]?.customerChange ?? false;
}



public async resolveWorkflowType(
    tenantId: number
): Promise<SalesWorkflowType> {

    const tenantStrategyService =
        getTenantStrategyServiceRepository();

    const strategies =
        await tenantStrategyService.getTenantStrategies(tenantId);

    const workflowStrategy =
        strategies.find(
            s => s.tenantStrategyName === 'Sales_Workflow'
        );

    if (!workflowStrategy) {
        throw new Error(
            `ClientRFQ workflow strategy is not configured for tenant ${tenantId}.`
        );
    }

    const workflowType =
        Object.values(SalesWorkflowType)
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
        workflowType: SalesWorkflowType
    ): Partial<Record<SOStatus, WorkflowNode>> {

        const workflow = this.workflows[workflowType];

        if (!workflow) {
            throw new Error(
                `Sales workflow '${workflowType}' is not configured.`
            );
        }

        return workflow;
    }

  public async getAllowedActions(
    workflowType: SalesWorkflowType,
    status: SOStatus
): Promise<ISalesActions> {

    return {

        canEdit: this.canEdit(workflowType, status),

        canDelete: this.canDelete(workflowType, status),

        canSubmitToApprove:
            this.canSubmitToApprove(workflowType, status),

        canApprove:
            this.canApprove(workflowType, status),

        canSend:
            this.canSend(workflowType, status),

        canChangeCustomer:
            this.canChangeCustomer(workflowType, status),

        nextStates:
            this.getNextAllowedStatuses(
            workflowType,
            status
    )    
    };
}

    getNextAllowedStatuses(
    workflowType: SalesWorkflowType,
    status: SOStatus
): SOStatus[] {

    const workflow = this.getWorkflow(workflowType);

    return workflow[status]?.next ?? [];
}


      
   public ensureCanSubmitToApprove(
    workflowType: SalesWorkflowType,
    status: SOStatus
): void {

    if (
        !this.canSubmitToApprove(
            workflowType,
            status
        )
    ) {

        throw new Error(
            `Sales cannot be submitted when status is '${status}' ` +
            `under workflow '${workflowType}'.`
        );
    }
}

    
    public ensureCanEdit(
    workflowType: SalesWorkflowType,
    status: SOStatus
): void {

    if (!this.canEdit(workflowType, status)) {

        throw new Error(
            `Sales cannot be edites when status is '${status}' ` +
            `under workflow '${workflowType}'.`
        );

    }
}

    public ensureCanApprove(
    workflowType: SalesWorkflowType,
    status: SOStatus
): void {

    if (!this.canApprove(workflowType, status)) {

        throw new Error(
            `Sales cannot be approved when status is '${status}' ` +
            `under workflow '${workflowType}'.`
        );

    }
}


      public ensureCanSend (
    workflowType: SalesWorkflowType,
    status: SOStatus
): void {

    if (!this.canSend(workflowType, status)) {

        throw new Error(
            `Sales cannot be sent when status is '${status}' ` +
            `under workflow '${workflowType}'.`
        );

    }
}

   
   

    public ensureCanChangeCustomer(
    workflowType: SalesWorkflowType,
    status: SOStatus
): void {

    if (!this.canChangeCustomer(workflowType, status)) {

        throw new Error(
            `Customer cannot be changed when quotation status is '${status}'.` +
            `under workflow '${workflowType}'.`
        );

    }
}

}