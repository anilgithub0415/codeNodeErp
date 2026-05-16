
export interface CreateProgramDto {
    tenantId?: string;
    programName?:string;
    programCode?:string;
    description?:string;
    durationMonths:number;
    targetExam?:string;
    isActive:boolean;
  }
  
  /**
   * DTO for updating an existing Program.
   * All fields are optional because you may only want to update a few properties.
   */
  export interface UpdateProgramDto{  
    tenantId?: string;
    programName?:string;
    programCode?:string;
    description?:string;
    durationMonths:number;
    targetExam?:string;
    isActive:boolean;
  }