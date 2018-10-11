import { NextFunction, Request, Response } from 'express';

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (
    req.session &&
    req.session.userId &&
    (process.env.NODE_ENV!.toLowerCase() !== 'production' || req.xhr)
  ) {
    next();
  } else {
    res.sendStatus(403);
  }
};
