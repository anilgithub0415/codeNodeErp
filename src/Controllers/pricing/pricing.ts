import { Router, Request, Response } from 'express';
import { getCityRepository} from '../../dependencies'
import PriceCalculationService from '../../services/PriceCalculationEngine';
import { AppDataSource } from '../../../data-source';

const router = Router();

// ==========================================
// POST: Pricing calculations
// ==========================================
// --- Route: /product/pricing/:tenantId

//pending its POST request and not get
router.route('/calculate').get(async (req: Request, res: Response) => {
    try {
        
            const priceCalcService = new PriceCalculationService(); 
            const obj =await priceCalcService.calculateLinePrice(1,  1, {    productId:2,
                                                                                     quantity:10, 
                                                                                     gstPercentage:18, targetPrice:111})

                                                                                        return res.status(200).json(obj );
    } catch (error: any) {
        console.error('Failed to run pricing calculation:', error.message);
        return res.status(500).json({ message: 'Error in pricing calculations.' });
    }
});


 
export default router;