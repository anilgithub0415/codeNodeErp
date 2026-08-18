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
  
        
        
        
 //customScript="item=context; const category = context.customerCategory;  if(category== 'B2C' && item.customAttributes?.tier_prices?.B2C_price){     item.finalPrice = item.customAttributes?.tier_prices.B2C_price;     }     else if (category== 'B2B'  && item.customAttributes?.tier_prices?.B2B_price){      item.finalPrice = item.customAttributes?.tier_prices.B2B_price;  }      else if (category== 'B2BC'  && item.customAttributes?.tier_prices?.B2BC_price){      item.finalPrice = item.customAttributes?.tier_prices.B2BC_price;  }      else {   item.finalPrice=item.basePrice;   }         item;"
 //customScript='const item = context.product; const category = context.customerCategory; if (category === "B2C" && item.customAttributes?.tier_prices?.B2C_price) {    item.finalPrice = item.customAttributes.tier_prices.B2C_price;}else if (    category === "B2B" &&   item.customAttributes?.tier_prices?.B2B_price) {    item.finalPrice = item.customAttributes.tier_prices.B2B_price;}else if (    category === "B2BC" &&    item.customAttributes?.tier_prices?.B2BC_price) {    item.finalPrice = item.customAttributes.tier_prices.B2BC_price;} else {    item.finalPrice = item.basePrice;}return 0;'
// customScript="const item = context; return {finalPrice:111};"
//{ sellingPrice: 222}

//Pending: Just change script named: A_Product_Pricing_Rule replace item = context with item = context.product 
//customScript='item = context.product;  const category = context.customerCategory;  if(category== "B2C" && item.customAttributes?.tier_prices?.B2C_price){     item.finalPrice = item.customAttributes?.tier_prices.B2C_price;     }   else if (category== "B2B"  && item.customAttributes?.tier_prices?.B2B_price){      item.finalPrice = item.customAttributes?.tier_prices.B2B_price;  }     else if (category== "B2BC"  && item.customAttributes?.tier_prices?.B2BC_price){      item.finalPrice = item.customAttributes?.tier_prices.B2BC_price;  }     else {   item.finalPrice = item.basePrice   } '
//customScript='item = context.product;  const category = context.customerCategory;  if(category== "B2C" && item.customAttributes?.tier_prices?.B2C_price){     item.customPrice = item.customAttributes?.tier_prices.B2C_price;     }   else if (category== "B2B"  && item.customAttributes?.tier_prices?.B2B_price){      item.customPrice = item.customAttributes?.tier_prices.B2B_price;  }     else if (category== "B2BC"  && item.customAttributes?.tier_prices?.B2BC_price){      item.customPrice = item.customAttributes?.tier_prices.B2BC_price;  }     else {   item.customPrice = item.basePrice   } '
// console.log(customScript);
 
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




/*The Optimized, Fixed Implementatio
Here is the secure, high-performance rewritten version. It addresses your variable references, optimizes Isolate generation, and fixes data retrieval.
 */
/*
import ivm from 'isolated-vm';

// 🚀 FIX #1: Re-use a single, long-lived Isolate across your entire application.
// Creating isolates on every request destroys Node.js performance.
const sharedIsolate = new ivm.Isolate({ memoryLimit: 128 });

export class HookBroker {
    private async getTenantScript(tenantId: number, scriptName: string): Promise<string> {
        const tenantCustomScriptService = getTenantCustomScriptsServiceRepository();
        const tenantCustomScriptEntry = await tenantCustomScriptService.getTenantSript(tenantId, scriptName);
        return tenantCustomScriptEntry?.scriptCode || '';
    }

    public async executeHook(scriptName: string, tenantId: number, context: any): Promise<any> {
        const customScript = await this.getTenantScript(tenantId, scriptName);

        if (!customScript) {
            console.log('No script stored for this hook.');
            return context;
        }

        try {
            // FIX #2: Create a quick, lightweight context inside our shared Isolate
            const isolateContext = await sharedIsolate.createContext();
            
            // FIX #3: Safely copy context into the isolate as a structured JSON object
            const external = new ivm.ExternalCopy(context);
            await isolateContext.global.set('context', external.copyInto());

            // FIX #4: Wrap the script in an Immediately Invoked Function Expression (IIFE)
            // This guarantees the tenant's modified product object is returned explicitly.
            const wrappedScript = `
                (function() {
                    const context = globalThis.context;
                    
                    // Tenant's original script body executes here
                    ${customScript}
                    
                    // Explicitly return the context object back to the host runtime
                    return context;
                })()
            `;

            // Compile the script asynchronously to avoid blocking the main thread
            const script = await sharedIsolate.compileScript(wrappedScript);
            
            // FIX #5: Lowered timeout from 1000ms to 50ms. 
            // 1 second is way too long for an ERP pricing calculation to hang.
            const resultRef = await script.run(isolateContext, { timeout: 50 });

            // FIX #6: Properly deserialize the returned value back into your main runtime
            if (resultRef && typeof resultRef.copy === 'function') {
                return await resultRef.copy();
            }

            return context;
        } catch (error: any) {
            console.error(`Tenant ${tenantId} hook error:`, error);
            // Fallback strategy: Return original un-priced context so ERP process doesn't break
            return context; 
        }
    }
}
 */