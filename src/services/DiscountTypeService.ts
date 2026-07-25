import { EntityManager, Repository } from 'typeorm';
import { DiscountType } from '../entity/DiscountType';

export interface CreateDiscountTypeDto {
    id?: number;
    tenantId: number;
    typeName: string;
    description?: string | null;
    isActive?: boolean;
    [key: string]: any;
}

export class DiscountTypeService {
    private typeRepository!: Repository<DiscountType>;

    async init(repo: Repository<DiscountType>): Promise<void> {
        this.typeRepository = repo;
        console.log("DiscountTypeService repository initialized.");       
    }

    async getDiscountType(ptenantId: number, pTypeId: number, manager?: EntityManager): Promise<DiscountType> {
        if (!this.typeRepository) throw new Error("DiscountTypeService repository not initialized.");
        const repo = manager ? manager.getRepository(DiscountType) : this.typeRepository;
        const result = await repo.findOne({ where: { tenantId: ptenantId, id: pTypeId } }); 
        return result!; 
    }

    async getDiscountTypes(ptenantId: number, manager?: EntityManager): Promise<DiscountType[]> {
        if (!this.typeRepository) throw new Error("DiscountTypeService repository not initialized.");
        const repo = manager ? manager.getRepository(DiscountType) : this.typeRepository;
        return await repo.find({ where: { tenantId: ptenantId, isActive: true } }); 
    }

    async createDiscountTypeClean(createDto: CreateDiscountTypeDto, manager?: EntityManager): Promise<DiscountType> {
        if (!this.typeRepository) throw new Error("DiscountTypeService repository not initialized.");
        const repo = manager ? manager.getRepository(DiscountType) : this.typeRepository;
        const { id, ...cleanCreatePayload } = createDto;

        const newType = repo.create(cleanCreatePayload);
        return await repo.save(newType);
    }

    async updateDiscountType(id: number, tenantId: number, updateDto: Partial<CreateDiscountTypeDto>, manager?: EntityManager): Promise<DiscountType> {
     
        
        if (!this.typeRepository) throw new Error("DiscountTypeService repository not initialized.");
        const repo = manager ? manager.getRepository(DiscountType) : this.typeRepository;
        
        const existingType = await repo.findOne({ where: { id, tenantId } });
        if (!existingType) throw new Error("DiscountType record not found or access denied.");

        const { id: payloadId, tenantId: payloadTenantId, ...updatableFields } = updateDto;
        Object.assign(existingType, updatableFields);
        return await repo.save(existingType);
    }
}
export default DiscountTypeService;
