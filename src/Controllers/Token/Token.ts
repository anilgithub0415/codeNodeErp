

import express, { Router, Request, Response } from 'express';
import { method1, method2, refreshtoken } from './Token_dbOps';

const router = Router();

router.post('/:id', (req: Request, res: Response) => { console.log('post method ap/token');
 
 // const id = parseInt(req.params.id, 10);
  const id = req.params.id
  switch (id) {
    case '1':
      method1(req, res);
      break;
    case '2':
      method2(req, res);
      break;
    case 'refresh-token':
      console.log('refresh token try');
      
      refreshtoken(req, res);
      break;
    default:
      res.status(400).json({ error: 'Invalid ID provided' });
      break;
  }
});

// module.exports = router;

export default router; 