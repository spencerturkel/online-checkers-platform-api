import { Router } from 'express';

import { environment } from '../environment';
import { User, users } from '../user';
import { GoogleAuthVerifier } from './google-auth-verifier';
import { authenticate } from './middleware';

export const authRouter = Router();

const googleAuthVerifier = new GoogleAuthVerifier(
  '395197363727-6iflms73n0evhotdbm9379dbkqipeupr.apps.googleusercontent.com',
);

if (!environment.production) {
  let nextLocalUserId = 0;
  authRouter.post('/local', (req, res) => {
    if (req.session && req.session.userId) {
      res.sendStatus(204);
      return;
    }

    const user: User = {
      id: `local-id-${nextLocalUserId}`,
      isPremium: false,
      name: `Local User ${nextLocalUserId}`,
      wins: 0,
      losses: 0,
    };

    ++nextLocalUserId;

    if (!users.get(user.id)) {
      users.set(user.id, user);
    }

    req.session!.userId = user.id;

    res.sendStatus(201);
  });
}

authRouter.post('/google', async (req, res) => {
  if (typeof req.body.token !== 'string') {
    return res.sendStatus(400);
  }

  const payload = await googleAuthVerifier.verify(req.body.token);

  if (!payload) {
    return res.sendStatus(401);
  }

  const user: User = {
    id: payload.sub,
    isPremium: false,
    name: payload.name!,
    wins: 0,
    losses: 0,
  };

  if (!users.get(user.id)) {
    users.set(user.id, user);
  }

  req.session!.userId = user.id;

  res.sendStatus(201);
});

authRouter.delete('/', authenticate, (req, res, next) => {
  req.session!.destroy(err => {
    if (err) {
      return next(err);
    }

    res.sendStatus(204);
  });
});
