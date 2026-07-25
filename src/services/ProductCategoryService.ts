import { EntityManager, Repository } from 'typeorm';
import { ProductCategory } from '../entity/ProductCategory';

interface CreateProductCategoryDto {
    id?: number;
    tenantId: number;
    categoryName: string;
    description?: string | null;
    defaultHsnId?: number | null;
    isActive?: boolean;
    [key: string]: any;
}

export interface CreatedCategoryResponse {
    category: ProductCategory;
}

export class ProductCategoryService {
    private categoryRepository!: Repository<ProductCategory>;

    async init(categoryRepo: Repository<ProductCategory>): Promise<void> {
        this.categoryRepository = categoryRepo;
        console.log("ProductCategoryService repository initialized.");       
    }

    async getCategory(
        ptenantId: number, pCategoryId: number,        
        manager?: EntityManager
    ): Promise<ProductCategory | null> {
        if (!this.categoryRepository) {
            throw new Error("ProductCategoryService repository not initialized. Call init() first.");
        }
        
        const repository = manager ? manager.getRepository(ProductCategory) : this.categoryRepository;
        return await repository.findOne({
            where: { tenantId: ptenantId, id: pCategoryId },
            relations: ['defaultHsnTaxRule'] // Fetching the linked default tax rules
        }); 
    }

    async getCategories(
        ptenantId: number,           
        manager?: EntityManager
    ): Promise<ProductCategory[]> {
        if (!this.categoryRepository) {
            throw new Error("ProductCategoryService repository not initialized. Call init() first.");
        }
        
        const repository = manager ? manager.getRepository(ProductCategory) : this.categoryRepository;
        return await repository.find({
            where: { tenantId: ptenantId },
            relations: ['defaultHsnTaxRule'] // Vital for the frontend to know the suggested HSN code
        });
    }

    async createCategory(
        createDto: CreateProductCategoryDto,
        manager?: EntityManager
    ): Promise<CreatedCategoryResponse> {
        // Fallback repo assignment if not within a shared parent transaction block
        const categoryRepo = manager ? manager.getRepository(ProductCategory) : this.categoryRepository;

        if (!manager && !this.categoryRepository) {
            throw new Error("ProductCategoryService repository not initialized.");
        }

        console.log('finding createDto.id for category:', createDto.id);
        
        let targetCategory = null;
        if (createDto.id) {
            targetCategory = await categoryRepo.findOne({ 
                where: { id: createDto.id, tenantId: createDto.tenantId } 
            });
        }

        // Clean up explicit null values for TypeORM compatibility
        if (createDto.defaultHsnId === null) delete createDto.defaultHsnId;
        if (createDto.description === null) delete createDto.description;

        let finalCategory: ProductCategory;

        if (targetCategory) {
            console.log('editing existing category..................');
            Object.assign(targetCategory, createDto);  
            finalCategory = await categoryRepo.save(targetCategory); 
        } else {
            console.log('creating new category......................');
            const newCategory = categoryRepo.create(createDto);
            finalCategory = await categoryRepo.save(newCategory); 
        }

        return { category: finalCategory };
    }

        async deleteCategory(
        ptenantId: number, pCategoryId: number,        
        manager?: EntityManager
    ): Promise<void> {
        if (!this.categoryRepository) {
            throw new Error("ProductCategoryService repository not initialized. Call init() first.");
        }
        
        // Determine whether to use a transaction manager instance or standard repository hook
        const categoryRepository = manager ? manager.getRepository(ProductCategory) : this.categoryRepository;
        
        // Verify entry presence inside the database engine
        const pc = await categoryRepository.findOne({
            where: { tenantId: ptenantId, id: pCategoryId }
        });

        if (!pc) {
            throw new Error("Product category not found inside this company scope account.");
        }

        // Remove from database (Triggers your MS SQL Server NO ACTION armor layer)
        await categoryRepository.remove(pc);
    }

}
