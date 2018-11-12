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

/**
 * Require that the request is authenticated.
 * Attaches the user ID and name to the request object.
 */
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
