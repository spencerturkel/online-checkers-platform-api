import cors from 'cors';
import express, { json } from 'express';
import helmet from 'helmet';

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

server.all('*', (req, res) => res.send('Hello, world'));

export default server;
