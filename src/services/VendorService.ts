import { EntityManager, FindOptionsWhere, Not, Repository } from 'typeorm';
import { Vendor } from '../entity/Vendor';
import { AppDataSource } from '../../data-source'; 

export interface CreateVendorDto {
    id?: number;
    tenantId: number;
    vendorName: string;
    description: string;
    [key: string]: any;
}

export interface CreatedVendorResponse {
    vendor: Vendor;
}

export class VendorService {
    private vendorRepository!: Repository<Vendor>;

    /**
     * Initializes the VendorService with its TypeORM repository instances.
     * This MUST be called AFTER AppDataSource.initialize() has completed.
     */
    async init(vendorRepo: Repository<Vendor>): Promise<void> {
        this.vendorRepository = vendorRepo;
        console.log("VendorService repository initialized.");       
    }

    async getVendor(
        ptenantId: number, 
        pProdId: number,        
        manager?: EntityManager
    ): Promise<Vendor> {
        if (!this.vendorRepository) {
            throw new Error("VendorService repository not initialized. Call init() first.");
        }
        
        const vendorRepository = manager ? manager.getRepository(Vendor) : this.vendorRepository;
        const ps = await vendorRepository.findOne({ where: { tenantId: ptenantId , id: pProdId } }); 
        return ps!; 
    }

    async getVendors(
        ptenantId: number,           
        manager?: EntityManager
    ): Promise<Vendor[]> {
        if (!this.vendorRepository) {
            throw new Error("VendorService repository not initialized. Call init() first.");
        }
        
        const vendorRepository = manager ? manager.getRepository(Vendor) : this.vendorRepository;
        const ps = await vendorRepository.find({ where: { tenantId: ptenantId } }); 
        return ps;
    }
    /**
     * Legacy/Upsert Strategy: Creates or Updates Vendor records atomically using a lookup check.
     */
    async createVendor(
        createDto: CreateVendorDto,
        manager?: EntityManager
    ): Promise<CreatedVendorResponse> {
        const queryRunner = manager ? manager.queryRunner : AppDataSource.createQueryRunner();
        let shouldReleaseQueryRunner = false;

        try {
            if (!manager) {
                await queryRunner!.connect();
                await queryRunner!.startTransaction();
                shouldReleaseQueryRunner = true;
            }

            const vendorRepo = queryRunner!.manager.getRepository(Vendor);
            let newORexistingvendor: Vendor;
          
            const { id, tenantId, ...uniqueIdentifiers } = createDto;
            let queryCondition: FindOptionsWhere<Vendor> = { tenantId };
            
            if (createDto.id) {
                queryCondition.id = createDto.id;
            } else {
                Object.assign(queryCondition, uniqueIdentifiers);
            }

            let aVendor = await vendorRepo.findOne({ where: queryCondition });
                  
            if (aVendor) {
                Object.assign(aVendor, createDto);  
                newORexistingvendor = aVendor;
                await vendorRepo.save(aVendor); 
            } else {
                let newVendor = vendorRepo.create(createDto);
                newORexistingvendor = newVendor;
                await vendorRepo.save(newVendor);  
            }

            if (shouldReleaseQueryRunner) {
                await queryRunner!.commitTransaction();
            }

            return { vendor: newORexistingvendor };

        } catch (error) {
            if (shouldReleaseQueryRunner) {
                await queryRunner!.rollbackTransaction();
            }
            console.error('Error in createVendor:', error);
            throw error;
        } finally {
            if (shouldReleaseQueryRunner) {
                await queryRunner!.release();
            }
        }
    }

    /**
     * Strict POST Action: Creates a brand new, unique Vendor instance record.
     */
    async createVendorClean(
        createDto: CreateVendorDto,
        manager?: EntityManager
    ): Promise<Vendor> {
        if (!this.vendorRepository) {
            throw new Error("VendorService repository not initialized. Call init() first.");
        }

        const vendorRepo = manager ? manager.getRepository(Vendor) : this.vendorRepository;

        // Completely strip any user-supplied IDs to eliminate sequence overwrite risks
        const { id, ...cleanCreatePayload } = createDto;

        const newVendor = vendorRepo.create(cleanCreatePayload);
        console.log(`[VendorService] Generating unique vendor instance context for: ${cleanCreatePayload.vendorName}`);
        return await vendorRepo.save(newVendor);
    }

    /**
     * Strict PUT Action: Overwrites an existing vendor profile safely after enforcing tenant validation.
     */
    async updateVendor(
        id: number,
        tenantId: number,
        updateDto: Partial<CreateVendorDto>,
        manager?: EntityManager
    ): Promise<Vendor> {
        if (!this.vendorRepository) {
            throw new Error("VendorService repository not initialized. Call init() first.");
        }

        const vendorRepo = manager ? manager.getRepository(Vendor) : this.vendorRepository;

        // 🔒 Security Boundary: Confirm resource ownership within active session tenant namespace
        const existingVendor = await vendorRepo.findOne({ where: { id, tenantId } });

        if (!existingVendor) {
            throw new Error("Vendor record not found or unauthorized cross-tenant resource modification attempted.");
        }

        // Erase structural tracking fields out of incoming change payload
        const { id: payloadId, tenantId: payloadTenantId, ...updatableFields } = updateDto;

        // Apply mutation payload context cleanly onto the tracked entity instance 
        Object.assign(existingVendor, updatableFields);

        console.log(`[VendorService] Saving updated structural variables for Vendor ID: ${id}`);
        return await vendorRepo.save(existingVendor);
    }
}

export default VendorService;
