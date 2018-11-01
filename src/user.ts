import { Request, Router } from 'express';
import { authenticate } from './auth/middleware';

export interface User {
  gameId?: string;
  id: string;
  name: string;
  wins: number;
  losses: number;
}

export const users = new Map<string, User>();

export const userRouter = Router();

userRouter.use(authenticate);

declare module 'express' {
  interface Request {
    user?: User;
  }
}

userRouter.use((req: Request, res, next) => {
  const currentUserId = req.session!.userId;

  req.user = users.get(currentUserId);

  if (req.user) {
    next();
    return;
  }

  req.session!.destroy(err => {
    if (err) {
      next(err);
    }

    res.sendStatus(500);
  });
});

userRouter.get('/info', (req: Request, res) => {
  const user = req.user!;

  res.json({ gameId: user.gameId, name: user.name });
});

userRouter.get('/stats', (req: Request, res) => {
  const user = req.user!;

  res.json({
    name: user.name,
    wins: user.wins,
    losses: user.losses,
    games: user.wins + user.losses,
  });
});
