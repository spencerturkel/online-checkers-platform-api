import cors from 'cors';
import express, { NextFunction, Request, Response } from 'express';
import session from 'express-session';
import helmet from 'helmet';

import { GoogleAuthVerifier } from './authentication/google-auth-verifier';

const googleAuthVerifier = new GoogleAuthVerifier(
  '395197363727-6iflms73n0evhotdbm9379dbkqipeupr.apps.googleusercontent.com',
);

const users = new Map<string, { id: string }>();

const runningInProduction = process.env.NODE_ENV === 'production';

const authenticate = (req: Request, res: Response, next: NextFunction) => {
  if (req.session && req.session.userId && (!runningInProduction || req.xhr)) {
    next();
  } else {
    res.sendStatus(403);
  }
};

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

server.post('/auth/google', async (req, res) => {
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

server.delete('/auth', authenticate, (req, res, next) => {
  req.session!.destroy(err => {
    if (err) {
      return next(err);
    }

    res.sendStatus(204);
  });
});

server.get('/users', (req, res) => {
  res.send([...users]);
});

server.get('/protected', authenticate, (req, res) => {
  res.send('Success!');
});

server.get('/test', (req, res) => {
  console.log('hit the end point');
  res.send([1, 2, { x: 1 }]);
  console.log(req.query);
});

let waitingUser: string | null = null;

interface GameState {
  playerOneId: string;
  playerTwoId: string;
  letter: string;
}

const games: { [ids: string]: GameState } = {};

server.post('/start-game', authenticate, (req, res) => {
  if (waitingUser === null) {
    waitingUser = req.session!.userID;
  } else {
    const playerOneId = waitingUser;
    const playerTwoId = req.session!.userId; // TODO: handle same user as waiting
    const letter = 'A'; // TODO: make this a random letter

    games[playerOneId + playerTwoId] = { playerOneId, playerTwoId, letter }; // TODO: better scheme for keying games
  }
});

server.get('/waiting', authenticate, (req, res) => {
  const userId = req.session!.userId;
  const gamesWithPlayer = Object.values(games).filter(
    x => x.playerOneId === userId || x.playerTwoId === userId,
  );

  if (gamesWithPlayer.length === 0) {
    res.sendStatus(204);
  } else {
    res.send({ game: gamesWithPlayer }); // TODO don't send all the fields
  }
});

server.all('*', (req, res) => res.send('Hello, world'));

export default server;
