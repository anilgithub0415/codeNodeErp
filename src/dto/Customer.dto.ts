// src/dto/CreateCustomer.dto.ts
export interface SiteDto {
  id?: number;
  siteName: string;
     // <-- id of CustomerCategory
  contactPersonName?: string;
  
  
}

export interface CreateCustomerDto {
  id?: number;                 // **primary key** – present only for edit
  tenantId: number;
  customerName: string;
  customerCategoryId: string;
  mobileNumber?: string;
  EmailId?: string;
  city?: number;
  sites: SiteDto[];
}