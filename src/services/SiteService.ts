
import { EntityManager, FindOptionsWhere, Not, Repository } from 'typeorm';
import { Site } from '../entity/Site';



import { AppDataSource } from '../../data-source'; 

interface CreateSiteDto{
    tenantId:number;
    siteName:string;
    contactPersonName:string;
    createdByUserId?:number;
    [key:string]:any;
}

export interface CreatedSiteResponse {
    site: Site;
  
}

export class SiteService{
 private siteRepository!: Repository<Site>;
     /**
         * Initializes the SiteService with its TypeORM repository instances.
         * This MUST be called AFTER AppDataSource.initialize() has completed.
         * @param siteRepo The TypeORM Repository instance for Site.
         * @param tenantRepo The TypeORM Repository instance for Tenant (if SiteService needs it).
         */
        async init(siteRepo: Repository<Site>): Promise<void> {
            this.siteRepository = siteRepo;
                console.log("SiteService repository initialized.");       
        }


        async getSite(
            ptenantId:number,   pProdId:number,        
            manager?: EntityManager
        ): Promise<Site> {
console.log('hitting url sites');
             if (!this.siteRepository) {
                        throw new Error("SiteService repository not initialized. Call init() first.");
                    }

                   
                    
                    const siteRepository = manager ? manager.getRepository(Site) : this.siteRepository;
                    const ps= await siteRepository.findOne({where:{tenantId:ptenantId , id:pProdId}}); // Use find() to get all 
                 
                    
                    return ps!; 
                }


        async getSites(
            ptenantId:number,           
            manager?: EntityManager
        ): Promise<Site[]> {
console.log('hitting url sites');
             if (!this.siteRepository) {
                        throw new Error("SiteService repository not initialized. Call init() first.");
                    }

                    console.log('ptenantId:',ptenantId);
                    
                    const siteRepository = manager ? manager.getRepository(Site) : this.siteRepository;
                    const ps= await siteRepository.find({where:{tenantId:ptenantId} }); // Use find() to get all 
                    console.log('sites count:',ps.length);
                    
                    return ps;
                }


    /**
     * Creates a new global Site, links them to a Person, and establishes their initial context
     * within a specified tenant and role.
     * This method now also atomically creates a role-specific profile (e.g., FacultyProfile).
     *
     * @param createDto Data for creating the site and their initial context.
     * @param manager Optional EntityManager for transactional operations.
     * @returns The created Site entity along with its initial context.
     */
    async createSite(
    createDto: CreateSiteDto,
    manager?: EntityManager
): Promise<CreatedSiteResponse> {
    const queryRunner = manager ? manager.queryRunner : AppDataSource.createQueryRunner();
    let shouldReleaseQueryRunner = false;

    try {
        if (!manager) {
            await queryRunner!.connect();
            await queryRunner!.startTransaction();
            shouldReleaseQueryRunner = true;
        }

        const siteRepo = queryRunner!.manager.getRepository(Site);
        let newORexistingsite: Site;

        // 💡 Precaution 1: Match the vendor query construction logic
        // This ensures updates via explicit ID can also modify the siteName safely
        const { id, tenantId, ...uniqueIdentifiers } = createDto;
        let queryCondition: FindOptionsWhere<Site> = { tenantId };

        if (createDto.id) {
            queryCondition.id = createDto.id;
        } else {
            // Fall back to tenantId + siteName structure if no ID is passed
            queryCondition.siteName = createDto.siteName;
        }

        // Find the record using the secure conditional block
        let aSite = await siteRepo.findOne({ where: queryCondition });
       
        if (aSite) {
            console.log(`Found existing site for update: ${createDto.siteName}`);
            
            // 💡 Precaution 2: Use deep assignment logic if 'customer' is passed as an object
            // This guarantees TypeORM tracks the foreign key change correctly
            Object.assign(aSite, createDto);  
            newORexistingsite = aSite;

            console.log('Updating existing record:', aSite);
            await siteRepo.save(aSite); 
        } else {
            console.log(`Creating fresh site record: ${createDto.siteName}`);
            
            let newSite = siteRepo.create(createDto);
            newORexistingsite = newSite;
            await siteRepo.save(newSite);  
        }

        if (shouldReleaseQueryRunner) {
            await queryRunner!.commitTransaction();
        }

        return { site: newORexistingsite };

    } catch (error) {
        if (shouldReleaseQueryRunner) {
            await queryRunner!.rollbackTransaction();
        }
        console.error('Error in createSite transaction context:', error);
        throw error;
    } finally {
        if (shouldReleaseQueryRunner) {
            await queryRunner!.release();
        }
    }
}


// Add these inside your export class SiteService { ... }

/**
 * Strict PUT Action: Updates an existing Site record after enforcing tenant isolation boundaries.
 * @param id The primary auto-increment database row ID of the target site record.
 * @param tenantId The validated tenantId from the JWT session token.
 * @param updateDto The sanitized fields to apply to the record.
 * @param manager Optional EntityManager for transactional operations.
 */
async updateSite(
    id: number,
    tenantId: number,
    updateDto: Partial<CreateSiteDto>,
    manager?: EntityManager
): Promise<Site> {
    const siteRepo = manager ? manager.getRepository(Site) : this.siteRepository;

    if (!this.siteRepository) {
        throw new Error("SiteService repository not initialized. Call init() first.");
    }

    // 🔒 Security Check: Find the record ensuring it belongs ONLY to the active token's tenantId
    const existingSite = await siteRepo.findOne({ where: { id, tenantId } });

    if (!existingSite) {
        throw new Error("Site resource not found or unauthorized access across multi-tenant boundaries.");
    }

    // Clean up immutable variables to ensure they are never changed by the payload update
    const { id: payloadId, tenantId: payloadTenantId, ...updatableFields } = updateDto;

    // Deep merge updates onto the tracked TypeORM entity instance
    Object.assign(existingSite, updatableFields);

    console.log(`[SiteService] Persisting updates safely for site ID: ${id}`);
    return await siteRepo.save(existingSite);
}

/**
 * Strict POST Action: Creates a fresh, isolated Site record without upsert logic hazards.
 */
async createSiteClean(
    createDto: CreateSiteDto,
    manager?: EntityManager
): Promise<Site> {
    const siteRepo = manager ? manager.getRepository(Site) : this.siteRepository;

    if (!this.siteRepository) {
        throw new Error("SiteService repository not initialized. Call init() first.");
    }

    // Explicitly guarantee no ID parameter bypass can overwrite an existing database entry
    const { id, ...cleanCreatePayload } = createDto;

    const newSite = siteRepo.create(cleanCreatePayload);
    console.log(`[SiteService] Creating unique new site record named: ${cleanCreatePayload.siteName}`);
    
    return await siteRepo.save(newSite);
}


    }
           
export default SiteService