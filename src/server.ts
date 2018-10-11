import cors from 'cors';
import express from 'express';
import session from 'express-session';
import helmet from 'helmet';

import { authRouter } from './auth/router';
import { gameRouter } from './game/router';
import { userRouter } from './users';

const runningInProduction = process.env.NODE_ENV === 'production';

const server = express();

server.set('etag', false);

if (runningInProduction) {
  server.set('trust proxy', 1); // trusts the NGINX proxy on Elastic Beanstalk
}

server.use(
  cors({
    credentials: true,
    allowedHeaders: ['Content-Type', 'X-Requested-With'],
    origin: [
      'http://localhost:8080', // front-end development URL
      'https://onlinecheckersplatform.com',
    ],
  }),
);
server.use(helmet());
server.use(helmet.noCache());
server.use(express.json());

server.use(
  session({
    cookie: {
      maxAge:
        15 /* minutes */ *
        60 /* seconds per minute */ *
        1000 /* milliseconds per second */,
      secure: runningInProduction,
    },
    name: 'id',
    resave: false,
    saveUninitialized: false,
    secret: runningInProduction ? process.env.SESSION_SECRET! : 'secret',
  }),
);

server.use(authRouter);
server.use(gameRouter);
server.use(userRouter);

server.all('*', (req, res) => res.send('Hello, world'));

export default server;
