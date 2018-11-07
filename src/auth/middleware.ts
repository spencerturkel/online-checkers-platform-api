import { NextFunction, Request, Response } from 'express';
import { environment } from '../environment';

declare global {
  namespace Express {
    interface Request {
      userId: string;
      userName: string;
    }
  }
}

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
    req.userName = req.session.name;
    req.userId = req.session.userId;
    next();
  } else {
    res.sendStatus(403);
  }
};
