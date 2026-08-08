import { EntityManager, FindOptionsWhere, Repository } from 'typeorm';
import { LineDiscount } from '../entity/LineDiscount';
import { AppDataSource } from '../../data-source'; 



export interface CreateLineDiscountDto {
    id?: number;
    tenantId: number;
    discountCode: string;
    description?: string;
    discountTypeId: number; // 💡 Updated to a strict number ID
    discountValue: number;
    productId: number;
    categoryId?: number | null;
      validFrom?: Date | null;
    validTo?: Date | null;
    isActive?: boolean;
    [key: string]: any;
}

export interface CreatedDiscountResponse {
    discount: LineDiscount;
}

export class LineDiscountService {
    private discountRepository!: Repository<LineDiscount>;

    async init(discountRepo: Repository<LineDiscount>): Promise<void> {
        this.discountRepository = discountRepo;
        console.log("LineDiscountService repository initialized.");       
    }

    async getDiscount(tenantId: number, discountId: number, manager?: EntityManager): Promise<LineDiscount|null> {
        if (!this.discountRepository) {
            throw new Error("LineDiscountService repository not initialized.");
        }
        const discountRepo = manager ? manager.getRepository(LineDiscount) : this.discountRepository;
        const result = await discountRepo.findOne({ 
            where: { tenantId: tenantId , id: discountId },
            relations: ['product'] // Dynamic loading for label tracking
        }); 
        return result; 
    }

    //Pending:Need to consider discount for customerId 
    //Pending: Need to consider discount for Quantity

    async findBestDiscount(
        tenantId:number,    productId:number,    productVariantId:number|null,
        customerId:number,  quantity:number,   sellingPrice:number, manager?: EntityManager
    ): Promise<LineDiscount> {
        if (!this.discountRepository) {
            throw new Error("LineDiscountService repository not initialized.");
        }
        const discountRepo = manager ? manager.getRepository(LineDiscount) : this.discountRepository;
        const result = await discountRepo.findOne({ 
            where: { tenantId: tenantId , productId:productId  },
            relations: ['product'] 
        }); 
        return result!; 

    }
   async getDiscounts(ptenantId: number, manager?: EntityManager): Promise<LineDiscount[]> {
    if (!this.discountRepository) {
        throw new Error("LineDiscountService repository not initialized.");
    }
    const discountRepo = manager ? manager.getRepository(LineDiscount) : this.discountRepository;
    return await discountRepo.find({ 
        where: { tenantId: ptenantId },
        relations: ['product', 'discountType'] // 💡 ADDED 'discountType' relation to pull master configurations
    }); 
}


    async createDiscountClean(
    createDto: CreateLineDiscountDto, 
    manager?: EntityManager
): Promise<LineDiscount> {
    if (!this.discountRepository) {
        throw new Error("LineDiscountService repository not initialized.");
    }
    
    const discountRepo = manager ? manager.getRepository(LineDiscount) : this.discountRepository;
    
    // Completely strip any user-supplied IDs to eliminate sequence overwrite risks
    const { id, ...cleanCreatePayload } = createDto;

    // 💡 BRIDGE MAP: Catch incoming 'discountType' number and assign it to the relational foreign key column name
    if (cleanCreatePayload.discountType !== undefined && cleanCreatePayload.discountType !== null) {
        (cleanCreatePayload as any).discountTypeId = Number(cleanCreatePayload.discountType);
        
        // Delete the raw placeholder parameter so TypeORM doesn't attempt to mismatch relational bindings
        delete cleanCreatePayload.discountType;
    }

    const newDiscount = discountRepo.create(cleanCreatePayload);
    console.log(`[LineDiscountService] Generating line discount entry for code: ${cleanCreatePayload.discountCode}`);
    
    return await discountRepo.save(newDiscount);
}


    async updateDiscount(
    id: number, 
    tenantId: number, 
    updateDto: Partial<CreateLineDiscountDto>, 
    manager?: EntityManager
): Promise<LineDiscount> {
    console.log('....................updating discount with data:', updateDto);
    
    if (!this.discountRepository) {
        throw new Error("LineDiscountService repository not initialized.");
    }
    
    const discountRepo = manager ? manager.getRepository(LineDiscount) : this.discountRepository;
    const existingDiscount = await discountRepo.findOne({ where: { id, tenantId } });

    if (!existingDiscount) {
        throw new Error("Line Discount record not found or cross-tenant modification blocked.");
    }

    const { id: payloadId, tenantId: payloadTenantId, ...updatableFields } = updateDto;

    // 💡 BRIDGE MAP: Catch incoming 'discountType' number and assign it to the actual entity column name
    if (updatableFields.discountType !== undefined) {
        existingDiscount.discountTypeId = Number(updatableFields.discountType);
        
        // Delete it so TypeORM doesn't attempt to overwrite the structural relation object array
        delete updatableFields.discountType; 
    }

    // Apply the remaining clean fields safely
    Object.assign(existingDiscount, updatableFields);
    
    return await discountRepo.save(existingDiscount);
}

}
export default LineDiscountService;
