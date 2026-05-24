import { Router, Request, Response } from 'express';
import { getProduct_tableServiceRepository } from '../../dependencies';



const router = Router();

// get ussert table fields
router.route('/product_table_fields')
.get(async (req: Request, res: Response) => {
    try {   
    

        const producttableService = getProduct_tableServiceRepository();
        const product_table_fields = await producttableService.get_product_table_fields();
        res.status(200).json(product_table_fields); 
    } catch (error: any) {
        console.error('Failed to retrieveproduct_table_fields:', error.message || error);
        res.status(500).json({ message: 'Failed to retrieve product_table_fields.' });
    }
});


export default router;