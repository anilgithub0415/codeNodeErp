// src/Services/UserService.ts
import { EntityManager, FindOptionsWhere, ILike, Not, Repository } from 'typeorm';
import { User } from '../entity/User';
import { UserRoleLookup } from '../entity/UserRoleLookup';
import { AppDataSource } from '../../data-source'; 
import * as bcrypt from 'bcrypt'; 
import { AutocodeService } from './autocode.service';
import { UserTenantContext } from '../entity/UserTenantContext';

export interface CreateUserAndContextDto {
    initialRoleName: string;  
    deviceInfo: string;
    userName: string;
    password: string;
    displayName?: string;
    googleId?: string;
    createdByUserId?: number;
    faculty_department?: string;
    faculty_designation?: string;
}

export interface CreatedUserResponse {
    user: User;
    initialContext: UserTenantContext;
    verificationToken?: string;
    password?: string;
}

interface CreateUserDto {
    id?: number;
    tenantId: number;
    clientId?: number | null; 
    siteId?: number | null;   
    userName: string;
    userAbbrevation?: string;
    assignedRoles?: string[]; // 👈 Changed from string to string array structure
    [key: string]: any;
}

interface UserWithRole extends User {
    assignedRoles?: string[]; // 👈 Replaced old roleNameInContext parameter reference
    faculty_department?: string | null; 
    faculty_designation?: string | null; 
}

export class UserService {
    private autocodeService!: AutocodeService;
    private userRepository!: Repository<User>;
    private userRoleLookupRepository!: Repository<UserRoleLookup>;
    private userTenantContextRepository!: Repository<UserTenantContext>;

    constructor() {
        this.autocodeService = new AutocodeService();
    }

    async init(
        userRepo: Repository<User>,  
        userRoleLookupRepo: Repository<UserRoleLookup>, 
        userTenantContRepo: Repository<UserTenantContext>
    ): Promise<void> {
        this.userRepository = userRepo;
        this.userTenantContextRepository = userTenantContRepo;
        this.userRoleLookupRepository = userRoleLookupRepo;
    }

    async Authenticate(userName: string, passwordPlain: string, manager?: EntityManager): Promise<User | null> {
      
        console.log('................................start.....................');
        
        const userRepo = manager ? manager.getRepository(User) : this.userRepository;
     
        
        const user = await userRepo.findOne({ where: { userName: userName } });
  console.log('!user?y/n:',!user);
   console.log('ispassword null?y/n:',!user?.password);
  
        if (!user || !user.password) return null; 

        const isPasswordValid = await bcrypt.compare(passwordPlain, user.password); 
        if (!!isPasswordValid) return null; // for a while exempted wrong password


        return user; 
    }

    private async hashPassword(plainPassword: string): Promise<string> {
        return await bcrypt.hash(plainPassword, 10);
    }

    /**
     * Creates a new global User, links them to a Person, and establishes their initial context
     * within a specified tenant and role.
     * This method now also atomically creates a role-specific profile (e.g., FacultyProfile).
     *
     * @param createDto Data for creating the user and their initial context.
     * @param manager Optional EntityManager for transactional operations.
     * @returns The created User entity along with its initial context.
     */
    async createUserAndContext(
        createDto: CreateUserAndContextDto,
        manager?: EntityManager
    ): Promise<CreatedUserResponse> {
        const queryRunner = manager ? manager.queryRunner : AppDataSource.createQueryRunner();
        let shouldReleaseQueryRunner = false;

        try {
            if (!manager) {
                await queryRunner!.connect();
                await queryRunner!.startTransaction();
                shouldReleaseQueryRunner = true;
            }

          
            const userRepo = queryRunner!.manager.getRepository(User);
            const userRoleLookupRepo = queryRunner!.manager.getRepository(UserRoleLookup);
            const userTenantContextRepo = queryRunner!.manager.getRepository(UserTenantContext);
            

           

            

            // 3. Create or Find User (existing logic)
            let newORexistinguser: User;
            let aUser = await userRepo.findOne({ where: { userName: createDto.userName } });
            if (aUser) {
               // console.log(`found user with contactemail: ${createDto.contactEmail}`);
                newORexistinguser = aUser;
            } else {
                console.log(`creating user with data username: ${createDto}`);
                const hashedPassword = await bcrypt.hash(createDto.password!, 10);
                const newUser = userRepo.create({
                    userName: createDto.userName,
                   // displayName: `${person.firstName} ${person.lastName || ''}`.trim(),
                   displayName:createDto.displayName,
                    password: hashedPassword,
                    isActive: true,
                    isEmailVerified: false,
                   // personId: person.id,
                    createdByUserId: createDto.createdByUserId
                });
                newORexistinguser = newUser;
                await userRepo.save(newUser); 
            }

            // 4. Create Initial UserTenantContext (existing logic)
            const newUserContext = userTenantContextRepo.create({
                userId: newORexistinguser.id,
               // tenantId: createDto.initialTenantId,
                roleName: createDto.initialRoleName,
                isActiveInContext: true,
            });
            await userTenantContextRepo.save(newUserContext);


           

            if (shouldReleaseQueryRunner) {
                await queryRunner!.commitTransaction();
            }

          return { user: newORexistinguser, initialContext: newUserContext };
            

        } catch (error) {
            if (shouldReleaseQueryRunner) {
                await queryRunner!.rollbackTransaction();
            }
            console.error('Error in createUserAndContext:', error);
            throw error;
        } finally {
            if (shouldReleaseQueryRunner) {
                await queryRunner!.release();
            }
        }
    }
    async getUser(ptenantId: number, pId: number, manager?: EntityManager): Promise<User> {
        const repo = manager ? manager.getRepository(User) : this.userRepository;
        const user = await repo.findOne({ where: { tenantId: ptenantId, id: pId } }); 
        return user!; 
    }

    async getUsersSimple(ptenantId: number, manager?: EntityManager): Promise<any[]> {
    const repo = manager ? manager.getRepository(User) : this.userRepository;
    
    const rawUsers = await repo.createQueryBuilder('user')
        .leftJoin(
            UserTenantContext, 
            'context', 
            'context.userId = user.id AND context.tenantId = :ptenantId', 
            { ptenantId }
        )
        // 1. Maintain your primary tenant isolation filter
        .where('user.tenantId = :ptenantId', { ptenantId })
        
        // 💡 2. ADDITION: Exclude any users that hold a 'SuperAdmin' context or role matching string
        // This stops them from being listed if they are linked to the tenant context space.
        .andWhere((qb) => {
            const subQuery = qb
                .subQuery()
                .select('utc.userId')
                .from(UserTenantContext, 'utc')
                .where('utc.roleName = :adminRole', { adminRole: 'SuperAdmin' })
                .getQuery();
            return 'user.id NOT IN ' + subQuery;
        })
        .select([
            'user.id as id',
            'user.tenantId as tenantId', 
            'user.userName as userName',
            'user.displayName as displayName',
            'user.clientId as clientId',
            'user.siteId as siteId',
            'context.roleName as roleName' 
        ])
        .getRawMany();

    const userMap = new Map<number, any>();
    for (const row of rawUsers) {
        if (!userMap.has(row.id)) {
            userMap.set(row.id, {
                id: row.id,
                tenantId: row.tenantId,
                userName: row.userName,
                displayName: row.displayName,
                clientId: row.clientId,
                siteId: row.siteId,
                assignedRoles: [] 
            });
        }
        if (row.roleName) {
            userMap.get(row.id).assignedRoles.push(row.roleName); 
        }
    }
    return Array.from(userMap.values());
}


    /**
     * Creates a core User instance and loops through the array of roles,
     * generating an active mapping entry for each one inside UserTenantContext.
     */
    async createUserClean(createDto: CreateUserDto, manager?: EntityManager): Promise<User> {
           console.log('posting new user..........:',createDto);
        const queryRunner = manager ? manager.queryRunner : AppDataSource.createQueryRunner();
        let shouldReleaseQueryRunner = false;

        try {
            if (!manager) {
                await queryRunner!.connect();
                await queryRunner!.startTransaction();
                shouldReleaseQueryRunner = true;
            }

         // 👈 1️⃣ CRITICAL: Import ILike helper at top of file

// ... inside createUserClean method:

const transUserRepo = queryRunner!.manager.getRepository(User);
const transContextRepo = queryRunner!.manager.getRepository(UserTenantContext);

// 2️⃣ Use ILike to catch case-insensitive variations like 'Atul' or 'ATUL'
const duplicateCheck = await transUserRepo.findOne({ 
    where: { 
        tenantId: createDto.tenantId, 
        userName: ILike(createDto.userName.trim()) 
    } 
});

if (duplicateCheck) {
    throw new Error(`aaaThe username '${createDto.userName}' already exists inside this tenant context.`);
}


            if (duplicateCheck) {
                
                throw new Error(`aaaThe username '${createDto.userName}' already exists inside this tenant context.`);
            }

            const { id, assignedRoles, ...cleanPayload } = createDto;
            console.log('check1 ...............................................');
            
            if (cleanPayload.password) {
                cleanPayload.password = await this.hashPassword(cleanPayload.password);
            }
console.log('check2 ...............................................');
         //   const { id, assignedRoles, ...cleanPayload } = createDto;

// Force tenantId to stay an explicit integer number 
const tenantId = Number(createDto.tenantId);

const newUserInstance = transUserRepo.create({
    ...cleanPayload,
    tenantId: Number(createDto.tenantId), // 👈 Explicitly bind this column
    clientId: createDto.clientId || null,
    siteId: createDto.siteId || null,
    isActive: true,
});

// If you have a relational array property on your User model (e.g., contexts) 
// that triggers a cascade save, map the data directly inside the instance:
// If you have a relational array property on your User model (e.g., contexts) 
// that triggers a cascade save, map the data directly inside the instance:
if (assignedRoles && Array.isArray(assignedRoles)) {
    
    // 1️⃣ Dedup roles array to eliminate duplicate record payloads completely
    const uniqueRoles = [...new Set(assignedRoles)];

    (newUserInstance as any).contexts = uniqueRoles.map(roleName => ({
        tenantId: tenantId, 
        roleName: roleName,
        isActiveInContext: true,
        // 2️⃣ If UserTenantContext links via username instead of userId, map it here:
        userName: cleanPayload.userName 
    }));
}


const savedUser = await transUserRepo.save(newUserInstance);


            if (shouldReleaseQueryRunner) {
                await queryRunner!.commitTransaction();
            }
            return savedUser;

        } catch (error) {
            console.log(error);
            
            if (shouldReleaseQueryRunner) await queryRunner!.rollbackTransaction();
            throw error;
        } finally {
            if (shouldReleaseQueryRunner) await queryRunner!.release();
        }
    }
    /**
     * Complete transactional implementation of updateUser supporting array-based role updates.
     */
        /**
     * Complete transactional implementation of updateUser supporting array-based role updates.
     * Fixed to accurately sync and wipe roles if an empty array [] is passed from Frontend.
     */
    async updateUser(id: number, tenantId: number, updateDto: Partial<CreateUserDto>, manager?: EntityManager): Promise<User> {
        
        const queryRunner = manager ? manager.queryRunner : AppDataSource.createQueryRunner();
        let shouldReleaseQueryRunner = false;

        try {
            if (!manager) {
                await queryRunner!.connect();
                await queryRunner!.startTransaction();
                shouldReleaseQueryRunner = true;
            }

            const transUserRepo = queryRunner!.manager.getRepository(User);
            const transContextRepo = queryRunner!.manager.getRepository(UserTenantContext);

            // 1. Verify existence and protect tenant boundaries
            const existingUser = await transUserRepo.findOne({ where: { id, tenantId } });
            if (!existingUser) {
                throw new Error("User record not found or cross-tenant modification violation detected.");
            }

            // 2. Destructure inputs cleanly
            const { 
                id: payloadId, tenantId: payloadTenantId, tenant, site, client, 
                createdAt, updatedAt, assignedRoles, roleNameInContext, ...updatableFields 
            } = updateDto;

            // 3. Process secure password hashing safely
            if (updatableFields.password !== undefined) {
                if (updatableFields.password.trim() !== '') {
                    existingUser.password = await this.hashPassword(updatableFields.password);
                }
                delete updatableFields.password;
            }

            // 4. Clean out undefined fields to prevent accidental property overrides
            Object.keys(updatableFields).forEach(key => {
                if (updatableFields[key] === undefined) delete updatableFields[key];
            });

            // 5. Update and commit core user metadata properties
            Object.assign(existingUser, updatableFields);
            const savedUser = await transUserRepo.save(existingUser);

            // 6. Normalize roles array targeting both modern array payload configurations and legacy fallbacks
            let targetRolesArray: string[] | null = null;
            
            if (assignedRoles !== undefined && Array.isArray(assignedRoles)) {
                targetRolesArray = assignedRoles; // Catches multi-select array (even if empty [])
            } else if (roleNameInContext) {
                targetRolesArray = [roleNameInContext]; // Legacy fallback string scalar path
            }

            // 7. Atomic Database Sync Strategy (Wipe and Rewrite)
           // 7. Atomic Database Sync Strategy (Wipe and Rewrite)
if (targetRolesArray !== null) {
    // Always clear out previous assignments under this specific tenant profile workspace context
    await transContextRepo.delete({ userId: id, tenantId: tenantId });
 
    if (targetRolesArray.length > 0) {
        // Construct the bulk raw rows array
        const contextRowsToInsert = targetRolesArray.map(roleName => ({
            userId: id,
            tenantId: tenantId,
            roleName: roleName,
            isActiveInContext: true
        }));

        // Execute as a single atomic bulk SQL INSERT statement
        await queryRunner!.manager
            .createQueryBuilder()
            .insert()
            .into(UserTenantContext)
            .values(contextRowsToInsert)
            .execute();
    }
}

            if (shouldReleaseQueryRunner) await queryRunner!.commitTransaction();
            return savedUser;

        } catch (error) {
            if (shouldReleaseQueryRunner) await queryRunner!.rollbackTransaction(); console.log('error for roles saving:',error);
            
            throw error;
        } finally {
            if (shouldReleaseQueryRunner) await queryRunner!.release();
        }
    }


    /**
     * Contextual target migration legacy route sync wrapper tracking updated structures.
     */
    async updateUserContextual(id: number, updateData: any, manager?: EntityManager): Promise<User | undefined> {
        const tenantId = updateData.activeTenantId;
        return this.updateUser(id, tenantId, updateData, manager);
    }

    async getById(id: number, manager?: EntityManager): Promise<User | undefined> {
        const repo = manager ? manager.getRepository(User) : this.userRepository;
        const auser = await repo.findOne({
            where: { id },
            relations: ['userTenantContexts'] 
        });
        return auser || undefined;
    }
    
    /**
     * Hydrates legacy arrays grouping parallel contextual target role identifiers.
     */async getUsers(activeTenantId: number, roles?: string[], manager?: EntityManager): Promise<any[]> {
    console.log('getUsers.......................');
    
    const repo = manager ? manager.getRepository(UserTenantContext) : this.userTenantContextRepository;
    
    if (!roles || roles.length === 0) return [];

    const userContexts = await repo.createQueryBuilder('utc')
        .leftJoinAndSelect('utc.user', 'user')
        .leftJoinAndSelect('utc.role', 'role')
        .leftJoinAndSelect('user.customer', 'customer') // Joins customer relation from user
        .leftJoinAndSelect('user.site', 'site')         // Joins site relation from user
        .where('utc.isActiveInContext = :isActive', { isActive: true })
        .andWhere('utc.tenantId = :activeTenantId', { activeTenantId })
        .andWhere('utc.roleName IN (:...roles)', { roles })
        .getMany();

    const userMap = new Map<number, any>();

    for (const context of userContexts) {
        if (context.user) {
            if (!userMap.has(context.user.id)) {
                userMap.set(context.user.id, {
                    ...context.user,
                    assignedRoles: [],
                    clientId: context.user.clientId, 
                    siteId: context.user.siteId,
                    // Extracts joined relational fields safely with optional chaining
                    clientName: context.user.client?.customerName || null,
                    siteName: context.user.site?.siteName || null
                });
            }
            if (context.role) {
                // Keep rolename casing exactly as your database configuration dictates (rolename vs roleName)
                userMap.get(context.user.id).assignedRoles.push(context.role.rolename || context.role.rolename);
            }
        }
    }
    return Array.from(userMap.values());
}

   


    async getUserById(userId: number, manager?: EntityManager): Promise<User | null> {
        const repo = manager ? manager.getRepository(User) : this.userRepository;
        return await repo.findOne({ where: { id: userId } });
    }
    
    async getUserByUserNameAndTenant(userName: string, tenantId: number, manager?: EntityManager): Promise<User | null> {
        const context = await this.userTenantContextRepository.createQueryBuilder('utc')
            .leftJoinAndSelect('utc.user', 'user')
            .where('user.userName = :userName', { userName })
            .andWhere('utc.tenantId = :tenantId', { tenantId })
            .getOne();

        return context ? context.user : null;
    }

    async getUserRolesForTenant(userId: number, tenantId: number, manager?: EntityManager): Promise<UserRoleLookup[]> {
        const repo = manager ? manager.getRepository(UserTenantContext) : this.userTenantContextRepository;
        const contexts = await repo.find({
            where: { userId, tenantId, isActiveInContext: true },
            relations: ['role']
        });
        return contexts.map(context => context.role);
    }

    async deleteUser(id: number, manager?: EntityManager): Promise<void> {
        const repo = manager ? manager.getRepository(User) : this.userRepository;
        await repo.delete(id);
    }

    async getUserRoles(ptenantId: number, manager?: EntityManager): Promise<UserRoleLookup[]> {
        const repo = manager ? manager.getRepository(UserRoleLookup) : this.userRoleLookupRepository;
        return await repo.find({ where: { tenantId: ptenantId } }); 
    }
}

export default UserService;
