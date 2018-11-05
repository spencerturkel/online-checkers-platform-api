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

const morganFormat = environment.production ? 'combined' : 'dev';

server.use(
  morgan(morganFormat, {
    skip: (req, res) => res.statusCode < 400,
    stream: process.stderr,
  }),
);

server.use(
  morgan(morganFormat, {
    skip: (req, res) => res.statusCode >= 400,
    stream: process.stdout,
  }),
);

server.use('/auth', authRouter);
server.use('/room', roomRouter);
server.use('/user', userRouter);

server.post('/email', async (req, res) => {
  await sgMail.send({
    to: req.body.to,
    from: 'noreply@onlinecheckersplatform.com',
    subject: req.body.subject,
    text: req.body.text,
  });

  res.sendStatus(204);
});

export default server;
