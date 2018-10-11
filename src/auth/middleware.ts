import { NextFunction, Request, Response } from 'express';
import { environment } from '../environment';

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (
    req.session &&
    req.session.userId &&
    (!environment.production || req.xhr)
  ) {
    next();
  } else {
    res.sendStatus(403);
  }
};
