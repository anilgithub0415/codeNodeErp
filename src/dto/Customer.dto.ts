// src/dto/CreateCustomer.dto.ts
export interface OrganisationDto {
  id?: number;
  organisationName: string;
  customerCategory: string;   // <-- id of CustomerCategory
  contactPersonName?: string;
  mobileNumber?: string;
  EmailId?: string;
  city?: string;
  Remarks?: string;
}

export interface CreateCustomerDto {
  id?: number;                 // **primary key** – present only for edit
  tenantId: number;
  customerName: string;
  organisations: OrganisationDto[];
}