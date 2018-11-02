import { Router } from 'express';

import { documents, tableName } from '../dynamo';
import { environment } from '../environment';
import { User, users } from '../user';
import { GoogleAuthVerifier } from './google-auth-verifier';
import { authenticate } from './middleware';

export const authRouter = Router();

const googleAuthVerifier = new GoogleAuthVerifier(
  '395197363727-6iflms73n0evhotdbm9379dbkqipeupr.apps.googleusercontent.com',
);

if (!environment.production) {
  authRouter.post('/local', async (req, res) => {
    if (req.session!.userId) {
      res.sendStatus(204);
      return;
    }
    if (
      !(
        req.body &&
        typeof req.body.id === 'string' &&
        typeof req.body.isPremium === 'boolean'
      )
    ) {
      res.status(400);
      res.send('Expected "email", "isPremium", and "id" fields');
      return;
    }

    const userId = req.body.id as string;

    const item = (await documents
      .get({
        Key: {
          userId,
        },
        TableName: tableName,
      })
      .promise()).Item;

    if (item) {
      users.set(userId, item as User);
    } else {
      const user: User = {
        userId,
        isPremium: req.body.isPremium,
        name: `Local User ${userId}`,
        wins: 0,
        losses: 0,
      };

      users.set(userId, user);
      await documents.put({ Item: user, TableName: tableName }).promise();
    }

    req.session!.userId = userId;
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
    userId: payload.sub,
    isPremium: false,
    name: payload.name!,
    wins: 0,
    losses: 0,
  };

  if (!users.get(user.userId)) {
    users.set(user.userId, user);
  }

  req.session!.userId = user.userId;

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
