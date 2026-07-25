// src/services/RolePermissionService.ts
import { EntityManager, FindOptionsWhere, Repository } from 'typeorm';
import { RolePermission } from '../entity/RolePermission';
import { AppDataSource } from '../../data-source'; 
import { CreateRolePermissionDto } from '../dto/RolePermissionDto';

export interface CreatedRolePermissionResponse {
    rolePermission: RolePermission;
}

export class RolePermissionService {
    private rolePermissionRepository!: Repository<RolePermission>;

    /**
     * Initializes the RolePermissionService with its TypeORM repository instances.
     * This MUST be called AFTER AppDataSource.initialize() has completed.
     */
    async init(rolePermissionRepo: Repository<RolePermission>): Promise<void> {
        this.rolePermissionRepository = rolePermissionRepo;
        console.log("RolePermissionService repository initialized.");       
    }

    /**
     * Retrieves all assigned permission records mapped to a specific role string.
     */
    async getPermissionsByRole(
        ptenantId: number, 
        pRoleName: string,        
        manager?: EntityManager
    ): Promise<RolePermission[]> {
        if (!this.rolePermissionRepository) {
            throw new Error("RolePermissionService repository not initialized. Call init() first.");
        }
        
        const repo = manager ? manager.getRepository(RolePermission) : this.rolePermissionRepository;
        return await repo.find({ 
            where: { tenantId: ptenantId, roleName: pRoleName },
            relations: ['permission'] // Optional: Loads underlying permission metadata if required by UI
        }); 
    }

    /**
     * Lists all role-permission assignment records under a tenant.
     */
    async getAllRolePermissions(
        ptenantId: number,           
        manager?: EntityManager
    ): Promise<RolePermission[]> {
        if (!this.rolePermissionRepository) {
            throw new Error("RolePermissionService repository not initialized. Call init() first.");
        }
        
        const repo = manager ? manager.getRepository(RolePermission) : this.rolePermissionRepository;
        return await repo.find({ where: { tenantId: ptenantId } });
    }

    /**
     * Legacy/Upsert Strategy: Creates or maintains mapping records atomically using lookup validation checks.
     */
    async createRolePermission(
        createDto: CreateRolePermissionDto & { tenantId: number },
        manager?: EntityManager
    ): Promise<CreatedRolePermissionResponse> {
        const queryRunner = manager ? manager.queryRunner : AppDataSource.createQueryRunner();
        let shouldReleaseQueryRunner = false;

        try {
            if (!manager) {
                await queryRunner!.connect();
                await queryRunner!.startTransaction();
                shouldReleaseQueryRunner = true;
            }

            const repo = queryRunner!.manager.getRepository(RolePermission);
            let newORexistingMapping: RolePermission;
          
            const { tenantId, roleName, permissionName } = createDto;
            const queryCondition: FindOptionsWhere<RolePermission> = { 
                tenantId, 
                roleName, 
                permissionName 
            };

            let existingMapping = await repo.findOne({ where: queryCondition });
                  
            if (existingMapping) {
                // Mapping already exists, safe re-assignment wrapper execution
                Object.assign(existingMapping, createDto);  
                newORexistingMapping = existingMapping;
                await repo.save(existingMapping); 
            } else {
                let newMapping = repo.create(createDto);
                newORexistingMapping = newMapping;
                await repo.save(newMapping);  
            }

            if (shouldReleaseQueryRunner) {
                await queryRunner!.commitTransaction();
            }

            return { rolePermission: newORexistingMapping };

        } catch (error) {
            if (shouldReleaseQueryRunner) {
                await queryRunner!.rollbackTransaction();
            }
            console.error('Error in createRolePermission:', error);
            throw error;
        } finally {
            if (shouldReleaseQueryRunner) {
                await queryRunner!.release();
            }
        }
    }

    /**
     * Strict POST Action: Creates a brand new, explicit mapping instance context.
     */
    async createRolePermissionClean(
        createDto: CreateRolePermissionDto & { tenantId: number },
        manager?: EntityManager
    ): Promise<RolePermission> {
        if (!this.rolePermissionRepository) {
            throw new Error("RolePermissionService repository not initialized. Call init() first.");
        }

        const repo = manager ? manager.getRepository(RolePermission) : this.rolePermissionRepository;

        const newMapping = repo.create(createDto);
        console.log(`[RolePermissionService] Mapping permission [${createDto.permissionName}] to role [${createDto.roleName}]`);
        return await repo.save(newMapping);
    }

    /**
     * Strict DELETE Action: Revokes access permissions by wiping out the relation matrix map record layer.
     */
    async deleteRolePermission(
        tenantId: number,
        roleName: string,
        permissionName: string,
        manager?: EntityManager
    ): Promise<void> {
        if (!this.rolePermissionRepository) {
            throw new Error("RolePermissionService repository not initialized. Call init() first.");
        }

        const repo = manager ? manager.getRepository(RolePermission) : this.rolePermissionRepository;

        // 🔒 Security Boundary: Enforce multi-tenant validation lookup context execution
        const targetMapping = await repo.findOne({ 
            where: { tenantId, roleName, permissionName } 
        });

        if (!targetMapping) {
            throw new Error("RolePermission relation mapping record not found or cross-tenant modification restricted.");
        }

        console.log(`[RolePermissionService] Revoking permission ${permissionName} from role ${roleName}`);
        await repo.remove(targetMapping);
    }
}

export default RolePermissionService;
