import ivm from "isolated-vm";
import { getTenantCustomScriptsServiceRepository } from "../../dependencies";

//we need isolated-vm option later for more sucurity
//so later switch from vm2 to isolated-vm

export class HookBroker{
    private async getTenantSript(tenantId:number, scriptName:string):Promise<string>{
        
                const tenantCustomScriptService= getTenantCustomScriptsServiceRepository();
             var tenantCustomScriptEntry= await   tenantCustomScriptService.getTenantSript(tenantId,scriptName);
            return tenantCustomScriptEntry.scriptCode;
    }

    public async executeHook(scriptName:string, tenantId:number,context:any):Promise<any>{
        var customScript =await this.getTenantSript(tenantId, scriptName);
       
        console.log('context:',context);
        
 //customScript="item=context; const category = context.customerCategory;  if(category== 'B2C' && item.customAttributes?.tier_prices?.B2C_price){     item.finalPrice = item.customAttributes?.tier_prices.B2C_price;     }     else if (category== 'B2B'  && item.customAttributes?.tier_prices?.B2B_price){      item.finalPrice = item.customAttributes?.tier_prices.B2B_price;  }      else if (category== 'B2BC'  && item.customAttributes?.tier_prices?.B2BC_price){      item.finalPrice = item.customAttributes?.tier_prices.B2BC_price;  }      else {   item.finalPrice=item.basePrice;   }         item;"
 //customScript='const item = context.product; const category = context.customerCategory; if (category === "B2C" && item.customAttributes?.tier_prices?.B2C_price) {    item.finalPrice = item.customAttributes.tier_prices.B2C_price;}else if (    category === "B2B" &&   item.customAttributes?.tier_prices?.B2B_price) {    item.finalPrice = item.customAttributes.tier_prices.B2B_price;}else if (    category === "B2BC" &&    item.customAttributes?.tier_prices?.B2BC_price) {    item.finalPrice = item.customAttributes.tier_prices.B2BC_price;} else {    item.finalPrice = item.basePrice;}return 0;'
// customScript="const item = context; return {finalPrice:111};"
//{ sellingPrice: 222}

//Pending: Just change script named: A_Product_Pricing_Rule replace item = context with item = context.product 
customScript='item = context.product;  const category = context.customerCategory;  if(category== "B2C" && item.customAttributes?.tier_prices?.B2C_price){     item.finalPrice = item.customAttributes?.tier_prices.B2C_price;     }   else if (category== "B2B"  && item.customAttributes?.tier_prices?.B2B_price){      item.finalPrice = item.customAttributes?.tier_prices.B2B_price;  }     else if (category== "B2BC"  && item.customAttributes?.tier_prices?.B2BC_price){      item.finalPrice = item.customAttributes?.tier_prices.B2BC_price;  }     else {   item.finalPrice = item.basePrice   } '

 console.log(customScript);
 
         if (!customScript) { console.log('Invalid script is here.................................');
         
            // No script stored for this hook – just return the original context.
            return context;
        }

        try {
            // 1️⃣ Create a new isolate (sandbox) with a modest memory limit.
            const isolate = new ivm.Isolate({ memoryLimit: 128 });
            // 2️⃣ Create a context inside that isolate.
            const isolateContext = isolate.createContextSync();
            // 3️⃣ Transfer the host `context` object into the isolate.
            // Use `transferOut:true` so that any modifications made inside the isolate are
            // reflected back to the host when we retrieve the value later.
            const external = new ivm.ExternalCopy(context);
            // Transfer the host context into the isolate (no transferOut option needed)
            isolateContext.global.setSync("context", external.copyInto());
            // 4️⃣ Compile the script fetched from the DB.
            // The script is expected to use the global variable `context` that we expose below.
            // 4️⃣ Compile the script fetched from the DB.
const wrapped = `
    const context = globalThis.context;   // alias global → local
    ${customScript}
`;
const script = isolate.compileScriptSync(wrapped);
            // 5️⃣ Execute the script with a timeout (ms).
            const rawResult = script.runSync(isolateContext, { timeout: 1000 });
            // 6️⃣ Retrieve the possibly‑modified `context` from the isolate.
            const ctxRef = isolateContext.global.getSync("context");
            const updatedContext = ctxRef && typeof (ctxRef as any).copy === "function"
                ? (ctxRef as any).copy()
                : ctxRef;
            // If the script explicitly returned a value, prefer that; otherwise return the updated context.
            const result =
                rawResult && typeof (rawResult as any).copy === "function"
                    ? (rawResult as any).copy()
                    : updatedContext;
            return result;
        } catch (error) {
            console.error(`Tenant ${tenantId} hook error:`, error);
            throw new Error("Custom processing failed");
        }
    }
}