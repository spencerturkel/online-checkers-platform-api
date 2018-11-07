import { Router } from 'express';
import uuid from 'uuid/v4';

import { documents, tableName } from '../dynamo';
import { environment } from '../environment';
import { User } from '../user';
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
    if (!(req.body && typeof req.body.id === 'string')) {
      res.status(400);
      res.send('Expected "id" string');
      return;
    }

    const userId = req.body.id as string;
    const name = `Local User ${userId}`;

    await documents
      .put({
        ConditionExpression: 'attribute_not_exists(userId)',
        Item: {
          userId,
          isPremium: req.body.isPremium || false,
          name,
          wins: 0,
          losses: 0,
        },
        TableName: tableName,
      })
      .promise()
      .catch(e => {
        if (e.code !== 'ConditionalCheckFailedException') {
          throw e;
        }
      });

    req.session!.name = name;
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

  const userId = payload.sub;
  const user: User = {
    userId,
    isPremium: false,
    name: payload.name!,
    wins: 0,
    losses: 0,
  };

  await documents
    .put({
      ConditionExpression: 'attribute_not_exists(userId)',
      Item: user,
      TableName: tableName,
    })
    .promise()
    .catch(e => {
      if (e.code !== 'ConditionalCheckFailedException') {
        throw e;
      }
    });

  req.session!.name = user.name;
  req.session!.userId = user.userId;

  res.sendStatus(201);
});

authRouter.post('/guest', async (req, res) => {
  if (typeof req.body.name !== 'string') {
    res.sendStatus(400);
    return;
  }

  const userId = uuid();
  const user: User = {
    userId,
    isPremium: false,
    name: req.body.name,
    wins: 0,
    losses: 0,
  };

  await documents
    .put({
      Item: user,
      TableName: tableName,
    })
    .promise();

  req.session!.isGuest = true;
  req.session!.name = req.body.name;
  req.session!.userId = user.userId;

  res.sendStatus(201);
});

authRouter.delete('/', authenticate, (req, res, next) => {
  if (req.session!.isGuest) {
    documents
      .delete({
        Key: { userId: req.userId },
        TableName: tableName,
      })
      .send();
  }

  req.session!.destroy(err => {
    if (err) {
      return next(err);
    }

    res.sendStatus(204);
  });
});
