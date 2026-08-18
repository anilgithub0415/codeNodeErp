// src/routes/tenantTypeLookupRouter.ts (Part 1)
import { Router, Request, Response } from 'express';
import { getTenantTypeRepository } from '../../dependencies'; // Adjust based on your dependency injection setup
import PriceCalculationEngine from '../../services/PriceCalculationEngine';

const router = Router();

// Runtime validation injection container check
router.use((req, res, next) => {
    try {
        getTenantTypeRepository();
        next();
    } catch (error: any) {
        console.error('TenantTypeLookupService dependency exception:', error.message);
        res.status(500).json({ message: 'Server initialization error. Lookup service not ready.' });
    }
});

router.route('').get(async (req: Request, res: Response) => {
    try {
       
console.log('....testing priceCal...........');



    const engine = new PriceCalculationEngine();

    const result =
        await engine.calculateLinePrice(

            1,              // tenantId
           2,             // customerId

            {
                productId: 1,
                quantity: 2,
                gstPercentage: 18
            }

        );

    console.log("================================");
    console.log("PRICE CALCULATION RESULT");
    console.log("================================");

    console.log("Base Price       :", result.basePrice);
    console.log("Selling Price    :", result.sellingPrice);
    console.log("Discount         :", result.discount);
    console.log("Discount ID      :", result.appliedDiscountId);
    console.log("GST Percentage   :", result.gstPercentage);
    console.log("GST Amount       :", result.gstAmount);
    console.log("Taxable Amount   :", result.taxableAmount);
    console.log("Total Amount     :", result.totalAmount);

    console.log("================================");


        return res.status(200).json();
    } catch (error: any) {
        console.error('Failed to retrieve lookup list:', error.message || error);
        return res.status(500).json({ message: "Failed to retrieve lookup rows: " + error.message });
    }
});

export default router;






