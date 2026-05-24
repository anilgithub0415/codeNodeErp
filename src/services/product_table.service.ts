//Product_tableService
import { Repository } from 'typeorm'; // Import Repository directly
import { product_table_fields } from '../entity/product_table_fields'; // Import your Product_table entity




 class product_tableService{

  
  private isInitialized = false;
  private currentProducttableFields:Partial<product_table_fields>[] = [
    { FieldName: 'prod_name', FieldType: 'input', FieldLabel: 'prod_name',    IsRequired: true      },

    { FieldName: 'description', FieldType: 'input', FieldLabel: 'description',    IsRequired: true      },
    { FieldName: 'sku', FieldType: 'input', FieldLabel: 'sku',    IsRequired: true      }, 

    { FieldName: 'base_price', FieldType: 'input', FieldLabel: 'base_price',    IsRequired: true    },
    
  ];
  private product_table_Repository!: Repository<product_table_fields>;
  
  
   /**
     * Initializes the Product_tableService with its TypeORM repository.
     * This MUST be called AFTER AppDataSource.initialize() has completed.
     * @param repo The TypeORM Repository instance for Product_table.
     */
      async init(repo: Repository<product_table_fields>): Promise<void> {
        this.product_table_Repository = repo;
       
      }
    

   

    
    /**
     * Ensures that a default settings record exists in the database.
     * If it doesn't exist, it creates one with predefined default values.
     * It then loads these settings into memory (this.currentProducttable).
     */
    async ensureDefaultProductTableFields(): Promise<void> {
      // Ensure repository is available before using it
      if (!this.product_table_Repository) {
          throw new Error("ProducttableService has not been initialized. Call init() first.");
      }

    
      try { 
          // 1. Try to find the existing settings record by its primary key
          let dbProducttableFields = await this.product_table_Repository.find({where:{}});

          if (!dbProducttableFields.length) {  
              // // 2. If no producttablefield record found, create one with default values
              // console.log('No global producttablefield found in DB. Creating default producttablefield record...');
              let dbProducttablefielddetails=null;
              this.currentProducttableFields.map(aproducttblFld=>{
            
               
               dbProducttablefielddetails = new product_table_fields() // Create an instance of the Producttable entity
               dbProducttablefielddetails.FieldName = aproducttblFld.FieldName?aproducttblFld.FieldName:'';
               dbProducttablefielddetails.FieldType = aproducttblFld.FieldType?aproducttblFld.FieldType:'';
               dbProducttablefielddetails.FieldLabel = aproducttblFld.FieldLabel?aproducttblFld.FieldLabel:'';
               dbProducttablefielddetails.IsRequired = aproducttblFld.IsRequired?aproducttblFld.IsRequired:true;
              
              // //Save the new default producttablefield to the database
              this.product_table_Repository.save(dbProducttablefielddetails);
               }
                 
                )
               console.log('Default settings record created in DB.');
          } else {
              console.log('Global settings found in database.');
          }

          // 3. Update the in-memory cache with values from the database
          this.currentProducttableFields = dbProducttableFields;

          this.isInitialized = true;
        
      } catch (error) {
          console.error('Error ensuring/loading default settings:', error);
          throw error; // Re-throw to indicate a critical initialization failure
      }
  }

   //This is for building for by reading which field exists in product table
    // get productt table fields
    get_product_table_fields = async (): Promise<any> => { // Or Observable<EnumOption[]> if backend sends label/value
    

    await this.ensureDefaultProductTableFields();
    if (!this.isInitialized) {
      console.warn('Product_tableService not fully initialized. Returning initial default settings. Ensure ensureDefaultProductTableFields() was called.');
  }
  return this.currentProducttableFields;

  }

 

}


 export default product_tableService