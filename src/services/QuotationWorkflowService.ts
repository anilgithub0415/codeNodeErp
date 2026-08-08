import { QuotationStatus } from "../entity/Quotation";

export interface IQuotationActions {

    canEdit:boolean;

    canDelete:boolean;

    canSubmit:boolean;

    canApprove:boolean;

    canCounterOffer:boolean;

    canRevise:boolean;

    canChangeCustomer:boolean;

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

export class QuotationWorkflowService {

 

private workflow: Partial<Record<QuotationStatus, WorkflowNode>> = {
    [QuotationStatus.DRAFT]: {
        editable: true,
        deletable: true,
        customerChange: true,
        next: [QuotationStatus.SENT]
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
        next: [QuotationStatus.REVISED]
    },

    [QuotationStatus.REVISED]: {
        editable: true,
        deletable: false,
        customerChange: false,
        next: [
            QuotationStatus.SENT,
            QuotationStatus.APPROVED
        ]
    },

    [QuotationStatus.APPROVED]: {
        editable: false,
        deletable: false,
        customerChange: false,
        next: []
    },

    [QuotationStatus.UNDER_REVIEW]: {
        editable: false,
        deletable: false,
        customerChange: false,
        next: []
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
};

        private canTransition(
            current: QuotationStatus,
            next: QuotationStatus
            ): boolean {

                return this.workflow[current]
                    ?.next
                    ?.includes(next) ?? false;

            }

    public canEdit(status: QuotationStatus): boolean {
        return this.workflow[status]?.editable ?? false;
    }

    public canDelete(status: QuotationStatus): boolean {
       return this.workflow[status]?.deletable ?? false;
    }

    public canSubmit(status: QuotationStatus): boolean {
       return this.canTransition(
        status,
        QuotationStatus.SENT
        );
    }


    public canApprove(status: QuotationStatus): boolean {
        return this.canTransition(
            status,
            QuotationStatus.APPROVED
            );
    }

    public canCounterOffer(status: QuotationStatus): boolean {
        return this.canTransition(
        status,
        QuotationStatus.COUNTER_OFFERED
        );
    }

    public canRevise(status: QuotationStatus): boolean {
        return this.canTransition(
            status,
            QuotationStatus.REVISED
            );
    }

    public canChangeCustomer(status: QuotationStatus): boolean {
        return this.workflow[status]?.customerChange ?? false;
    }

   public getAllowedActions(status: QuotationStatus): IQuotationActions {

    return {

        canEdit: this.canEdit(status),

        canDelete: this.canDelete(status),

        canSubmit: this.canSubmit(status),

        canApprove: this.canApprove(status),

        canCounterOffer: this.canCounterOffer(status),

        canRevise: this.canRevise(status),

        canChangeCustomer: this.canChangeCustomer(status),

        

    };

}

    getNextAllowedStatuses(status: QuotationStatus): QuotationStatus[]{
        return this.workflow[status]?.next ?? [];
    }

    public ensureCanSubmit(status: QuotationStatus): void {
        if (!this.canSubmit(status)) {
            throw new Error(`Quotation cannot be submitted when status is '${status}'.`);
        }
    }

    
    public ensureCanEdit (status: QuotationStatus): void {
        if (!this.canEdit(status)) {
            throw new Error(`Quotation cannot be edites when status is '${status}'.`);
        }
    }

    public ensureCanApprove(status: QuotationStatus): void {
        if (!this.canApprove(status)) {
            throw new Error(`Quotation cannot be approved when status is '${status}'.`);
        }
    }

    public ensureCanRevise(status: QuotationStatus): void {
        if (!this.canRevise(status)) {
            throw new Error(`Quotation cannot be revised when status is '${status}'.`);
        }
    }

    public ensureCanCounterOffer(status: QuotationStatus): void {
        if (!this.canCounterOffer(status)) {
            throw new Error(`Quotation cannot receive a counter offer when status is '${status}'.`);
        }
    }

    public ensureCanChangeCustomer(status: QuotationStatus): void {
        if (!this.canChangeCustomer(status)) {
            throw new Error(`Customer cannot be changed when quotation status is '${status}'.`);
        }
    }
}