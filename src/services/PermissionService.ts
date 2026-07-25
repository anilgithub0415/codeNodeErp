// src/services/PermissionService.ts
import { EntityManager, FindOptionsWhere, Repository } from 'typeorm';
import { Permission } from '../entity/Permission';
import { AppDataSource } from '../../data-source'; 
import { CreatedPermissionResponse, CreatePermissionDto } from '../dto/PermissionDto';




export class PermissionService {
    private permissionRepository!: Repository<Permission>;

    /**
     * Initializes the PermissionService with its TypeORM repository instances.
     * This MUST be called AFTER AppDataSource.initialize() has completed.
     */
    async init(permissionRepo: Repository<Permission>): Promise<void> {
        this.permissionRepository = permissionRepo;
        console.log("PermissionService repository initialized.");       
    }

    async getPermission(
        ptenantId: number, 
        pPermissionId: number,        
        manager?: EntityManager
    ): Promise<Permission> {
        if (!this.permissionRepository) {
            throw new Error("PermissionService repository not initialized. Call init() first.");
        }
        
        const permissionRepository = manager ? manager.getRepository(Permission) : this.permissionRepository;
        const ps = await permissionRepository.findOne({ where: { tenantId: ptenantId, id: pPermissionId } }); 
        return ps!; 
    }

    async getPermissions(
        ptenantId: number,           
        manager?: EntityManager
    ): Promise<Permission[]> {
        if (!this.permissionRepository) {
            throw new Error("PermissionService repository not initialized. Call init() first.");
        }
        
        const permissionRepository = manager ? manager.getRepository(Permission) : this.permissionRepository;
        const ps = await permissionRepository.find({ where: { tenantId: ptenantId } }); 
        return ps;
    }

    /**
     * Legacy/Upsert Strategy: Creates or Updates Permission records atomically using a lookup check.
     */
    async createPermission(
        createDto: CreatePermissionDto,
        manager?: EntityManager
    ): Promise<CreatedPermissionResponse> {
        const queryRunner = manager ? manager.queryRunner : AppDataSource.createQueryRunner();
        let shouldReleaseQueryRunner = false;

        try {
            if (!manager) {
                await queryRunner!.connect();
                await queryRunner!.startTransaction();
                shouldReleaseQueryRunner = true;
            }

            const permissionRepo = queryRunner!.manager.getRepository(Permission);
            let newORexistingPermission: Permission;
          
            const { id, tenantId, ...uniqueIdentifiers } = createDto;
            let queryCondition: FindOptionsWhere<Permission> = { tenantId };
            
            if (createDto.id) {
                queryCondition.id = createDto.id;
            } else {
                Object.assign(queryCondition, uniqueIdentifiers);
            }

            let aPermission = await permissionRepo.findOne({ where: queryCondition });
                  
            if (aPermission) {
                Object.assign(aPermission, createDto);  
                newORexistingPermission = aPermission;
                await permissionRepo.save(aPermission); 
            } else {
                let newPermission = permissionRepo.create(createDto);
                newORexistingPermission = newPermission;
                await permissionRepo.save(newPermission);  
            }

            if (shouldReleaseQueryRunner) {
                await queryRunner!.commitTransaction();
            }

            return { permission: newORexistingPermission };

        } catch (error) {
            if (shouldReleaseQueryRunner) {
                await queryRunner!.rollbackTransaction();
            }
            console.error('Error in createPermission:', error);
            throw error;
        } finally {
            if (shouldReleaseQueryRunner) {
                await queryRunner!.release();
            }
        }
    }

    /**
     * Strict POST Action: Creates a brand new, unique Permission instance record.
     */
    async createPermissionClean(
        createDto: CreatePermissionDto,
        manager?: EntityManager
    ): Promise<Permission> {
        if (!this.permissionRepository) {
            throw new Error("PermissionService repository not initialized. Call init() first.");
        }

        const permissionRepo = manager ? manager.getRepository(Permission) : this.permissionRepository;

        // Completely strip any user-supplied IDs to eliminate sequence overwrite risks
        const { id, ...cleanCreatePayload } = createDto;

        const newPermission = permissionRepo.create(cleanCreatePayload);
        console.log(`[PermissionService] Generating unique permission instance context for: ${cleanCreatePayload.permissionName}`);
        return await permissionRepo.save(newPermission);
    }

    /**
     * Strict PUT Action: Overwrites an existing permission profile safely after enforcing tenant validation.
     */
    async updatePermission(
        id: number,
        tenantId: number,
        updateDto: Partial<CreatePermissionDto>,
        manager?: EntityManager
    ): Promise<Permission> {
        if (!this.permissionRepository) {
            throw new Error("PermissionService repository not initialized. Call init() first.");
        }

        const permissionRepo = manager ? manager.getRepository(Permission) : this.permissionRepository;

        // 🔒 Security Boundary: Confirm resource ownership within active session tenant namespace
        const existingPermission = await permissionRepo.findOne({ where: { id, tenantId } });

        if (!existingPermission) {
            throw new Error("Permission record not found or unauthorized cross-tenant resource modification attempted.");
        }

        // Erase structural tracking fields out of incoming change payload
        const { id: payloadId, tenantId: payloadTenantId, ...updatableFields } = updateDto;

        // Apply mutation payload context cleanly onto the tracked entity instance 
        Object.assign(existingPermission, updatableFields);

        console.log(`[PermissionService] Saving updated structural variables for Permission ID: ${id}`);
        return await permissionRepo.save(existingPermission);
    }
}

export default PermissionService;
