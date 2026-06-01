


//Product_tableService
import { EntityManager, Repository } from 'typeorm'; // Import Repository directly
import { product_table_fields_tenantwise } from '../entity/product_table_fields_tenantwise'; // Import your Product_table entity




 class product_tableService{

  
  private isInitialized = false;
  private ProducttableFields_tenantwise:Partial<product_table_fields_tenantwise>[] = [
   
    { FieldName: 'B2C_price', FieldType: 'input', FieldLabel: 'B2c_price',    IsRequired: true  },
     
    { FieldName: 'B2B_price', FieldType: 'input', FieldLabel: 'B2B_price',    IsRequired: true     },
     
    { FieldName: 'B2BC_price', FieldType: 'input', FieldLabel: 'B2BC_price',    IsRequired: true      },
     
  ];  
  private product_table_tenantwise_Repository!: Repository<product_table_fields_tenantwise>;
  
  
   /**
     * Initializes the Product_tableService with its TypeORM repository.
     * This MUST be called AFTER AppDataSource.initialize() has completed.
     * @param repo The TypeORM Repository instance for Product_table.
     */
      async init(repo: Repository<product_table_fields_tenantwise>): Promise<void> {
        this.product_table_tenantwise_Repository = repo;
     console.log('initialising prod table  fields_tenantwise .......................')
      }
    

   

    
   

   //This is for building for by reading which field exists in product table
    // get productt table fields_tenantwise
    get_product_table_fields_tenantwise = async ( ptenantId:number,           
                manager?: EntityManager): Promise<any> => { // Or Observable<EnumOption[]> if backend sends label/value
    
      if (!this.product_table_tenantwise_Repository) {
               throw new Error("Product_tabletenantwiseService repository not initialized. Call init() first.");
          }
      const productRepository = manager ? manager.getRepository(product_table_fields_tenantwise) : this.product_table_tenantwise_Repository;
                        const ProducttabletenantwiseFields= await productRepository.find({where:{tenantId:ptenantId}}); // Use find() to get all 
                                           
                      
      return ProducttabletenantwiseFields;

  }

 

}


 export default product_tableService
