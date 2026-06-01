import {getCustomerServiceRepository, getProductRepository, getTenantStrategyServiceRepository} from '../dependencies'
import { HookBroker } from './execution/hook-broker';


class PriceCalculationService{
private hookBroker =new HookBroker();         
   
      async  calculateFinalPrice(tenantId:number, productId:number, customerId:number,p:any){
         const tenantStrategyService=getTenantStrategyServiceRepository();
         const customerService=getCustomerServiceRepository();
         const strategies =await tenantStrategyService.getTenantStrategies(tenantId);

         const pricingStrategy= strategies.find(s=>s.tenantStrategyName==='Pricing_Strategy')
         
        
         //CATEGORY_BASED (Gharana)
         if(pricingStrategy!.tenantStrategy=="CATEGORY_BASED"){

            const customer=await customerService.getCustomerById(tenantId,customerId);
            const customerCategory=customer?.customerCategory;

            return await this.getProductFinalPrice(tenantId,customerCategory!,p);

         }

      }


      async getProductFinalPrice(tenantId:number,  customerCategory:string,p:any){
         Object.assign(p,{customerCategory:customerCategory})          
         
         //hook for single product pricing
         var hookName='A_Product_Pricing_Rule'
         const processedProduct=await this.hookBroker.executeHook(hookName,tenantId,p);        
         
         return processedProduct.finalPrice; 

      }
   }
   
   export default PriceCalculationService