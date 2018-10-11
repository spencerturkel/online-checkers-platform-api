import { Router } from 'express';
import { authenticate } from './auth/middleware';

export const users = new Map<
  string,
  {
    gameId?: string;
    id: string;
    name: string;
    wins: number;
  }
>();

export const userRouter = Router();

userRouter.use(authenticate);

userRouter.get('/info', (req, res, next) => {
  const currentUserId = req.session!.userId;

  const user = users.get(currentUserId);
  if (!user) {
    req.session!.destroy(err => {
      if (err) {
        next(err);
      }

      res.sendStatus(404);
    });

    return;
  }

  res.json({ gameId: user.gameId, name: user.name, wins: user.wins });
});
