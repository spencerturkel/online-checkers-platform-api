import { Router } from 'express';

import { users } from '../users';
import { GoogleAuthVerifier } from './google-auth-verifier';
import { authenticate } from './middleware';

export const authRouter = Router();

const googleAuthVerifier = new GoogleAuthVerifier(
  '395197363727-6iflms73n0evhotdbm9379dbkqipeupr.apps.googleusercontent.com',
);

authRouter.post('/auth/google', async (req, res) => {
  if (typeof req.body.token !== 'string') {
    return res.sendStatus(400);
  }

  const payload = await googleAuthVerifier.verify(req.body.token);

  if (!payload) {
    return res.sendStatus(401);
  }

  const user = { id: payload.sub, name: payload.name!, wins: 0 };

  if (!users.get(user.id)) {
    users.set(user.id, user);
  }

  req.session!.userId = user.id;

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
