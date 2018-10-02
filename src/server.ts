import cors from 'cors';
import express, { json } from 'express';
import helmet from 'helmet';

import { GoogleAuthVerifier } from './google-auth-verifier';

const googleAuthVerifier = new GoogleAuthVerifier(
  '395197363727-6iflms73n0evhotdbm9379dbkqipeupr.apps.googleusercontent.com',
);

const users = new Set();

const server = express();

server.use(
  cors({
    origin: [
      'http://localhost:8080', // front-end development URL
      'https://onlinecheckersplatform.com',
    ],
  }),
);
server.use(helmet());
server.use(json());

server.post('/auth/google', async (req, res) => {
  if (typeof req.body.token !== 'string') {
    console.log(typeof req.body, req.body);
    return res.sendStatus(400);
  }

  const user = await googleAuthVerifier.verify(req.body.token);

  if (!user) {
    return res.sendStatus(401);
  }

  users.add(user);

  res.sendStatus(201);
});

server.get('/users', (req, res) => {
  res.send([...users]);
});

server.all('*', (req, res) => res.send('Hello, world'));

export default server;
