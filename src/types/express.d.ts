// This file extends the Express Request object with a new property.
// It's a "declaration file" that doesn't contain any executable code.
declare namespace Express {
    export interface Request {
      id?: {
        username: string;
      };
      user:any
    }
  }