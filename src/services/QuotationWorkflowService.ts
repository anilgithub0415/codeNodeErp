import express, { Request, Response } from 'express';

import { Quotation, QuotationStatus } from "../entity/Quotation";
import { getTenantStrategyServiceRepository } from '../dependencies';

export enum QuotationWorkflowType {
    STANDARD_APPROVAL = 'STANDARD_APPROVAL',
  //  NOSENDSTEP = 'NOSENDSTEP',
    
}

export interface IQuotationActions {
    canEdit: boolean;
    canDelete: boolean;
    canSubmitToApprove: boolean;
    canApprove: boolean;
    canSend:boolean;
    canCounterOffer: boolean;
    canRevise: boolean;
    canChangeCustomer: boolean;
}


       interface WorkflowNode {
    editable: boolean;
    deletable: boolean;
    customerChange: boolean;
    next: QuotationStatus[];
}

export interface QuotationWorkflowDto {

    status: QuotationStatus;

    editable: boolean;

    customerChange: boolean;

    deletable: boolean;

    nextStates: QuotationStatus[];

}

type QuotationWorkflowDefinition =
    Partial<Record<QuotationStatus, WorkflowNode>>;

 
export class QuotationWorkflowService {

    
private workflows: Record<QuotationWorkflowType, QuotationWorkflowDefinition> = {

  [QuotationWorkflowType.STANDARD_APPROVAL]: {
    [QuotationStatus.DRAFT]: {
        editable: true,
        deletable: true,
        customerChange: true,
        next: [
            QuotationStatus.PENDING_APPROVAL
        ]
    },

    [QuotationStatus.PENDING_APPROVAL]: {
    editable: false,
    deletable: false,
    customerChange: false,
    next: [
        QuotationStatus.APPROVED,
        QuotationStatus.REJECTED
    ]
    },

    [QuotationStatus.APPROVED]: {
        editable: false,
        deletable: false,
        customerChange: false,
        next: [
            QuotationStatus.SENT
        ]
    },

    [QuotationStatus.SENT]: {
        editable: false,
        deletable: false,
        customerChange: false,
        next: [
            QuotationStatus.COUNTER_OFFERED,
            QuotationStatus.APPROVED
        ]
    },

    [QuotationStatus.COUNTER_OFFERED]: {
        editable: false,
        deletable: false,
        customerChange: false,
        next: [
            QuotationStatus.REVISED
        ]
    },

    [QuotationStatus.REVISED]: {
        editable: true,
        deletable: false,
        customerChange: false,
        next: [
            QuotationStatus.PENDING_APPROVAL
        ]
    },

    

    [QuotationStatus.REJECTED]: {
        editable: false,
        deletable: false,
        customerChange: false,
        next: []
    },

    [QuotationStatus.CANCELLED]: {
        editable: false,
        deletable: false,
        customerChange: false,
        next: []
    }
} //end of STANDARD_APPROVAL

};

      

      private canTransition(
    workflowType: QuotationWorkflowType,
    current: QuotationStatus,
    next: QuotationStatus
): boolean {

    const workflow = this.getWorkflow(workflowType);

    return workflow[current]
        ?.next
        ?.includes(next) ?? false;
}


 public canEdit(
    workflowType: QuotationWorkflowType,
    status: QuotationStatus
): boolean {

    const workflow = this.getWorkflow(workflowType);

    return workflow[status]?.editable ?? false;
}

public canDelete(
    workflowType: QuotationWorkflowType,
    status: QuotationStatus
): boolean {

    const workflow = this.getWorkflow(workflowType);

    return workflow[status]?.deletable ?? false;
}
   public canSubmitToApprove(
    workflowType: QuotationWorkflowType,
    status: QuotationStatus
): boolean {

    return this.canTransition(
        workflowType,
        status,
        QuotationStatus.PENDING_APPROVAL
    );
}
    //this is sending to client

    public canApprove(
    workflowType: QuotationWorkflowType,
    status: QuotationStatus
): boolean {

    return this.canTransition(
        workflowType,
        status,
        QuotationStatus.APPROVED
    );
}

    public canSend( 
        workflowType: QuotationWorkflowType,
        status: QuotationStatus
    ): boolean {

        return this.canTransition(
            workflowType,
            status,
            QuotationStatus.SENT
        );
    }

    public canCounterOffer(  
        workflowType: QuotationWorkflowType,
        status: QuotationStatus
    ): boolean {

        return this.canTransition(
            workflowType,
            status,
            QuotationStatus.COUNTER_OFFERED
        );
    }


    public canRevise(  
        workflowType: QuotationWorkflowType,
        status: QuotationStatus
    ): boolean {

        return this.canTransition(
            workflowType,
            status,
            QuotationStatus.REVISED
        );
    }

    public canChangeCustomer( 
    workflowType: QuotationWorkflowType,
    status: QuotationStatus
): boolean {

    const workflow = this.getWorkflow(workflowType);

    return workflow[status]?.customerChange ?? false;
}



public async resolveWorkflowType(
    tenantId: number
): Promise<QuotationWorkflowType> {

    const tenantStrategyService =
        getTenantStrategyServiceRepository();

    const strategies =
        await tenantStrategyService.getTenantStrategies(tenantId);

    const workflowStrategy =
        strategies.find(
            s => s.tenantStrategyName === 'Quotation_Workflow'
        );

    if (!workflowStrategy) {
        throw new Error(
            `ClientRFQ workflow strategy is not configured for tenant ${tenantId}.`
        );
    }

    const workflowType =
        Object.values(QuotationWorkflowType)
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
        workflowType: QuotationWorkflowType
    ): Partial<Record<QuotationStatus, WorkflowNode>> {

        const workflow = this.workflows[workflowType];

        if (!workflow) {
            throw new Error(
                `Quotation workflow '${workflowType}' is not configured.`
            );
        }

        return workflow;
    }

   public async getAllowedActions(    workflowType: QuotationWorkflowType,status: QuotationStatus): Promise< IQuotationActions> {

    const tenantStrategyService =
        getTenantStrategyServiceRepository();

      

    return {

        canEdit: this.canEdit(workflowType,status),

        canDelete: this.canDelete(workflowType,status),

               canSubmitToApprove:this.canSubmitToApprove(workflowType,status),

        canApprove: this.canApprove(workflowType,status),

        canSend: this.canSend(workflowType,status),

        canCounterOffer: this.canCounterOffer(workflowType,status),

        canRevise: this.canRevise(workflowType,status),

        canChangeCustomer: this.canChangeCustomer(workflowType,status),

        

    };

}

    getNextAllowedStatuses(
    workflowType: QuotationWorkflowType,
    status: QuotationStatus
): QuotationStatus[] {

    const workflow = this.getWorkflow(workflowType);

    return workflow[status]?.next ?? [];
}


      
    public ensurecanSubmitToApprove(
        workflowType: QuotationWorkflowType,
        status: QuotationStatus
    ): void {

        if (!this.canSubmitToApprove(workflowType, status)) {

            throw new Error(
                `Quotation cannot be submitted when status is '${status}' ` +
                `under workflow '${workflowType}'.`
            );

        }
    }

    
    public ensureCanEdit(
    workflowType: QuotationWorkflowType,
    status: QuotationStatus
): void {

    if (!this.canEdit(workflowType, status)) {

        throw new Error(
            `Quotation cannot be edites when status is '${status}' ` +
            `under workflow '${workflowType}'.`
        );

    }
}

    public ensureCanApprove(
    workflowType: QuotationWorkflowType,
    status: QuotationStatus
): void {

    if (!this.canApprove(workflowType, status)) {

        throw new Error(
            `Quotation cannot be approved when status is '${status}' ` +
            `under workflow '${workflowType}'.`
        );

    }
}


      public ensureCanSend (
    workflowType: QuotationWorkflowType,
    status: QuotationStatus
): void {

    if (!this.canSend(workflowType, status)) {

        throw new Error(
            `Quotation cannot be sent when status is '${status}' ` +
            `under workflow '${workflowType}'.`
        );

    }
}

    public ensureCanRevise(
    workflowType: QuotationWorkflowType,
    status: QuotationStatus
): void {

    if (!this.canRevise(workflowType, status)) {

        throw new Error(
            `Quotation cannot be revised when status is '${status}' ` +
            `under workflow '${workflowType}'.`
        );

    }
}
    public ensureCanCounterOffer(
    workflowType: QuotationWorkflowType,
    status: QuotationStatus
): void {

    if (!this.canCounterOffer(workflowType, status)) {

        throw new Error(
            `Quotation cannot receive a counter offer when status is '${status}'.` +
            `under workflow '${workflowType}'.`
        );

    }
}

    public ensureCanChangeCustomer(
    workflowType: QuotationWorkflowType,
    status: QuotationStatus
): void {

    if (!this.canChangeCustomer(workflowType, status)) {

        throw new Error(
            `Customer cannot be changed when quotation status is '${status}'.` +
            `under workflow '${workflowType}'.`
        );

    }
}

}