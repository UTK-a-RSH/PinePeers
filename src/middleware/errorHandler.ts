
import { Request, Response, NextFunction } from 'express';
import { CustomError } from '../types/customError';

const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(err.stack); 
  if (err instanceof CustomError) {
    return res.status(err.statusCode).json({ error: err.message, details: err.details });
  }

  res.status(500).json({ error: 'Internal Server Error' });
};

export default errorHandler;