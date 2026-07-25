import { EntityManager, Like, Repository } from 'typeorm';
import { UserRoleLookup } from '../entity/UserRoleLookup';
import { AppDataSource } from '../../data-source';
import { Not } from 'typeorm'; // 💡 Import Not operator from TypeORM

export class UserRoleService {
    private userRoleRepository!: Repository<UserRoleLookup>;

    public init(userRoleRepo:Repository<UserRoleLookup>) {
        this.userRoleRepository = userRoleRepo;
    }

    async getRole(
        ptenantId: number, pRoleName: string,        
        manager?: EntityManager
    ): Promise<UserRoleLookup> {
        if (!this.userRoleRepository) {
            throw new Error("UserRoleService repository not initialized. Call init() first.");
        }
        const userRoleRepository = manager ? manager.getRepository(UserRoleLookup) : this.userRoleRepository;
        const role = await userRoleRepository.findOne({
            where: { tenantId: ptenantId, rolename: pRoleName },
            relations: ['rolePermissions'] 
        }); 
        return role!; 
    }

   

async getRoles(ptenantId: number, manager?: EntityManager): Promise<UserRoleLookup[]> {
    if (!this.userRoleRepository) {
        throw new Error("UserRoleService repository not initialized. Call init() first.");
    }
    const userRoleRepository = manager ? manager.getRepository(UserRoleLookup) : this.userRoleRepository;
    
    return await userRoleRepository.find({
        where: { 
            tenantId: ptenantId,
            rolename: Not('SuperAdmin') // 💡 FIX: Explicitly exclude 'SuperAdmin' from the returned array
        }
    });
}


    async deleteRole(
        ptenantId: number, pRoleName: string,        
        manager?: EntityManager
    ): Promise<void> {
        if (!this.userRoleRepository) {
            throw new Error("UserRoleService repository not initialized. Call init() first.");
        }
        const userRoleRepository = manager ? manager.getRepository(UserRoleLookup) : this.userRoleRepository;
        
        // Locate the target composite row context
        const role = await userRoleRepository.findOne({
            where: { tenantId: ptenantId, rolename: pRoleName }
        });

        if (!role) {
            throw new Error("Role record not found inside this company scope account.");
        }

        // Remove from database (Triggers MS SQL Server NO ACTION protection rule)
        await userRoleRepository.remove(role);
    }
    
            async saveRoleClean(createDto: any, manager?: EntityManager): Promise<UserRoleLookup> {
        console.log('posting new role..........:', createDto);
        const queryRunner = manager ? manager.queryRunner : AppDataSource.createQueryRunner();
        let shouldReleaseQueryRunner = false;

        try {
            if (!manager) {
                await queryRunner!.connect();
                await queryRunner!.startTransaction();
                shouldReleaseQueryRunner = true;
            }

            // 1. Get our transaction repositories explicitly
            const transRoleRepo = queryRunner!.manager.getRepository(UserRoleLookup);

            // 2. Case-insensitive duplication validation check
            const duplicateCheck = await transRoleRepo.findOne({ 
                where: { 
                    tenantId: createDto.tenantId, 
                    rolename: Like(createDto.rolename.trim()) 
                } 
            });

            if (duplicateCheck) {
                throw new Error(`The role name '${createDto.rolename}' already exists inside this tenant context.`);
            }

            console.log('check1 ...............................................');

            // 3. Destructure properties out safely
            const { tenantId: dtoTenant, rolename: dtoRole, assignedPermissions, ...cleanPayload } = createDto;
            const tenantId = Number(createDto.tenantId);
            const trimmedRoleName = createDto.rolename.trim();

            console.log('check2 ...............................................');

            // 4. Instantiated a raw javascript object matching your model schema directly
            // This completely avoids TypeORM's broken `.create()` compiler array bugs!
            const newRoleInstance = new UserRoleLookup();
            Object.assign(newRoleInstance, cleanPayload);
            
            newRoleInstance.tenantId = tenantId;
            newRoleInstance.rolename = trimmedRoleName;
            newRoleInstance.isActive = createDto.isActive !== undefined ? createDto.isActive : true;

            // 5. Map permissions cleanly to the array if they exist
            if (assignedPermissions && Array.isArray(assignedPermissions)) {
                const uniquePermissions = [...new Set(assignedPermissions)];

                newRoleInstance.rolePermissions = uniquePermissions.map(permissionName => {
                    return {
                        tenantId: tenantId,
                        RoleName: trimmedRoleName,
                        permissionName: permissionName,
                        isAllowed: true
                    } as any; // Temporary cast to bypass missing import definitions safely
                });
            }

            // 6. Execute transactional save operation
            const savedRole = await transRoleRepo.save(newRoleInstance);

            if (shouldReleaseQueryRunner) {
                await queryRunner!.commitTransaction();
            }
            return savedRole;

        } catch (error) {
            console.log(error);
            if (shouldReleaseQueryRunner) await queryRunner!.rollbackTransaction();
            throw error;
        } finally {
            if (shouldReleaseQueryRunner) await queryRunner!.release();
        }
    }


    async updateRole(tenantId: number, roleName: string, updateDto: any, manager?: EntityManager): Promise<UserRoleLookup> {
        const queryRunner = manager ? manager.queryRunner : AppDataSource.createQueryRunner();
        let shouldReleaseQueryRunner = false;

        try {
            if (!manager) {
                await queryRunner!.connect();
                await queryRunner!.startTransaction();
                shouldReleaseQueryRunner = true;
            }

            const transRoleRepo = queryRunner!.manager.getRepository(UserRoleLookup);

            // 1. Verify existence using composite primary key keys and protect boundaries
            const existingRole = await transRoleRepo.findOne({ 
                where: { tenantId, rolename: roleName } 
            });
            
            if (!existingRole) {
                throw new Error("Role record not found or cross-tenant modification violation detected.");
            }

            // 2. Destructure inputs cleanly to prevent payload poisoning of primary keys
            const { 
                tenantId: payloadTenantId, rolename: payloadRoleName, tenant,
                createdAt, updatedAt, assignedPermissions, ...updatableFields 
            } = updateDto;

            // 3. Clean out undefined fields to prevent accidental property overrides
            Object.keys(updatableFields).forEach(key => {
                if (updatableFields[key] === undefined) delete updatableFields[key];
            });

            // 4. Update and commit core role metadata properties
            Object.assign(existingRole, updatableFields);
            const savedRole = await transRoleRepo.save(existingRole);

            // 5. Normalize permissions array targeting array payload configurations
            let targetPermissionsArray: string[] | null = null;
            if (assignedPermissions !== undefined && Array.isArray(assignedPermissions)) {
                targetPermissionsArray = assignedPermissions; // Catches multi-select array (even if empty [])
            }

            // 6. Atomic Database Sync Strategy (Wipe and Rewrite)
            if (targetPermissionsArray !== null) {
                // Always clear out previous assignments under this specific tenant profile workspace context
                // TypeORM delete statement uses composite identifier match fields
                await queryRunner!.manager.delete('RolePermission', { 
                    tenantId: tenantId, 
                    RoleName: roleName 
                });
             
                if (targetPermissionsArray.length > 0) {
                    // Dedup array values to prevent primary composite key constraint collisions
                    const uniquePermissions = [...new Set(targetPermissionsArray)];

                    // Construct the bulk raw rows array matching your bridge schema fields
                    const permissionRowsToInsert = uniquePermissions.map(permissionName => ({
                        tenantId: tenantId,
                        RoleName: roleName,
                        permissionName: permissionName,
                        isAllowed: true
                    }));

                    // Execute as a single atomic bulk SQL INSERT statement via QueryBuilder
                    await queryRunner!.manager
                        .createQueryBuilder()
                        .insert()
                        .into('RolePermission')
                        .values(permissionRowsToInsert)
                        .execute();
                }
            }

            if (shouldReleaseQueryRunner) await queryRunner!.commitTransaction();
            return savedRole;

        } catch (error) {
            if (shouldReleaseQueryRunner) await queryRunner!.rollbackTransaction(); 
            console.log('error for permissions saving:', error);
            throw error;
        } finally {
            if (shouldReleaseQueryRunner) await queryRunner!.release();
        }
    }


}
