import { Router } from 'express';

import { GoogleAuthVerifier } from './google-auth-verifier';
import { authenticate } from './middleware';

export const authRouter = Router();

const googleAuthVerifier = new GoogleAuthVerifier(
  '395197363727-6iflms73n0evhotdbm9379dbkqipeupr.apps.googleusercontent.com',
);

const users = new Map<string, { id: string }>();

authRouter.post('/auth/google', async (req, res) => {
  if (typeof req.body.token !== 'string') {
    return res.sendStatus(400);
  }

  const userId = await googleAuthVerifier.verify(req.body.token);

  if (!userId) {
    return res.sendStatus(401);
  }

  const user = { id: userId };

  users.set(userId, user);

  req.session!.userId = userId;

  res.sendStatus(201);
});

authRouter.delete('/auth', authenticate, (req, res, next) => {
  req.session!.destroy(err => {
    if (err) {
      return next(err);
    }

    res.sendStatus(204);
  });
});
