import { Permission } from "../entity/Permission";


export interface CreatePermissionDto {
    id?: number;
    tenantId: number;
    permissionName: string;
    description?: string | null;
    isActive?: boolean;
    [key: string]: any;
}

export interface CreatedPermissionResponse {
    permission: Permission;
}