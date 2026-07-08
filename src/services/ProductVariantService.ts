import { EntityManager, Repository } from "typeorm";
import { ProductVariant } from "../entity/productVariant";

export class ProductVariantService{
private productVariantRepository!: Repository<ProductVariant>;
    async init(productTempRepo: Repository<ProductVariant>): Promise<void> {
                this.productVariantRepository = productTempRepo;
                    console.log("ProductTemplateService repository initialized.");       
            }


                    async getProductVariant(
                        ptenantId:number,   pProdVariantId:number,        
                        manager?: EntityManager
                    ): Promise<ProductVariant> {
            
                         if (!this.productVariantRepository) {
                                    throw new Error("ProductVariantService repository not initialized. Call init() first.");
                                }
            
                               
                                
                                const productVariantRepository = manager ? manager.getRepository(ProductVariant) : this.productVariantRepository;
                                const ps= await productVariantRepository.findOne({where:{ id:pProdVariantId}}); // Use find() to get all 
                             
                                
                                return ps!; 
                            }

}