// src/dto/CreateCustomer.dto.ts
export interface SiteDto {
  id?: number;
  tenantId:number;
  siteName: string;
     // <-- id of CustomerCategory
  siteContactPerson?: string;
  
  
}

export interface CreateCustomerDto {
  id?: number;                 // **primary key** – present only for edit
  tenantId: number;
  customerName: string;
  customerCategoryId: string;
  commercialContactPhone?: string;
  EmailId?: string;
  city?: number;
  sites: SiteDto[];
}