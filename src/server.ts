/**
 * This module exports the configured Express server.
 */

import sgMail from '@sendgrid/mail';
import cors from 'cors';
import express from 'express';
import session from 'express-session';
import helmet from 'helmet';
import morgan from 'morgan';

import { authRouter } from './auth/router';
import { environment } from './environment';
import { roomRouter } from './room';
import { userRouter } from './user';

const runningInProduction = process.env.NODE_ENV === 'production';

sgMail.setApiKey(process.env.SENDGRID_KEY!);

const server = express();

server.set('etag', false); // disables ETag caching

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
server.use(helmet()); // adds standard security headers
server.use(helmet.noCache()); // disables HTTP caching
server.use(express.json()); // parse JSON request bodies

server.use(
  session({
    cookie: {
      maxAge:
        15 /* minutes */ *
        60 /* seconds per minute */ *
        1000 /* milliseconds per second */,
      secure: runningInProduction, // no HTTPS in development
    },
    name: 'id',
    resave: false,
    saveUninitialized: false,
    secret: runningInProduction ? process.env.SESSION_SECRET! : 'secret',
  }),
);

const morganFormat = environment.production ? 'combined' : 'dev';

if (!('__TEST__' in global)) {
  // no request logging in tests
  server.use(
    morgan(morganFormat, {
      skip: (req, res) => res.statusCode < 400,
      stream: process.stderr,
    }),
  );

  server.use(
    morgan(morganFormat, {
      skip: (req, res) =>
        (req.method === 'GET' && req.originalUrl.startsWith('/room')) ||
        res.statusCode >= 400,
      stream: process.stdout,
    }),
  );
}

server.use('/auth', authRouter);
server.use('/room', roomRouter);
server.use('/user', userRouter);

export default server;
