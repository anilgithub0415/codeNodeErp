import {VM} from "vm2";
import { getTenantCustomScriptsServiceRepository } from "../../dependencies";

//we need isolated-vm option later for more sucurity
//so later switch from vm2 to isolated-vm

export class HookBroker{
    private async getTenantSript(tenantId:string, scriptName:string):Promise<string>{
        
                const tenantCustomScriptService= getTenantCustomScriptsServiceRepository();
             var tenantCustomScriptEntry= await   tenantCustomScriptService.getTenantSript(tenantId,scriptName);
            return tenantCustomScriptEntry.scriptCode;
    }

    public async executeHook(scriptName:string, tenantId:string,context:any):Promise<any>{
        var customScript =await this.getTenantSript(tenantId, scriptName);
       
        //customScript="var item = context; var category = 'B2C'; if(category== 'B2C' && item.customAttributes?.tier_prices?.B2C_price){     item.finalPrice =item.customAttributes?.tier_prices.B2C_price;     }    else if (category== 'B2BC' && item.customAttributes?.tier_prices?.B2BC_price){     item.finalPrice =item.customAttributes?.tier_prices.B2BC_price;  }    else {   item.finalPrice = item.basePrice   }  context = item;  context;"
        //customScript="const item = context;  const category = context.customerCategory;  if(category== 'B2C' && item.customAttributes?.tier_prices?.B2C_price){     item.finalPrice = item.customAttributes?.tier_prices.B2C_price;     }    else if (category== 'B2BC' && item.customAttributes?.tier_prices?.B2BC_price){     item.finalPrice = item.customAttributes?.tier_prices.B2BC_price;  }    else {   item.finalPrice = item.basePrice   }         context = item;  context;"

console.log(customScript);

 
        if(!customScript){
            return context;
        }

        try{
            const vm = new VM({
                timeout: 1000,
                sandbox:{context}
            })

             const result= vm.run(await customScript,{});

              return result;
        } catch(error){
            console.error(`Tenant ${tenantId} hook error:`,error);
            throw new Error("Custom processing failed");
        }
    }
}