import { RequestHandler, Router } from 'express';

import { authenticate } from '../auth/middleware';
import { documents, tableName } from '../dynamo';
import {
  Color,
  Coordinate,
  dark,
  Game,
  light,
  MoveRequest,
  MoveResponse,
} from './game';

export const gameRouter = Router();

gameRouter.use(authenticate);

let waitingUserId: string | null = null;

const currentGames: Game[] = [];
let nextGameId = 0;

declare global {
  namespace Express {
    interface Request {
      game?: Game;
      userColor?: Color;
    }
  }
}

const findGame: RequestHandler = (req, res, next) => {
  for (const game of currentGames) {
    if (game.lightId === req.userId) {
      req.game = game;
      req.userColor = light;
      break;
    }

    if (game.darkId === req.userId) {
      req.game = game;
      req.userColor = dark;
      break;
    }
  }

  next();
};

const userTimeouts: { [userId: string]: NodeJS.Timer } = {};

gameRouter.post('/start', findGame, async (req, res) => {
  let gameId;

  if (req.game) {
    gameId = req.game.id;
  } else if (waitingUserId == null) {
    waitingUserId = req.userId;
    res.sendStatus(204);
    return;
  } else if (waitingUserId === req.userId) {
    res.sendStatus(400);
    return;
  } else {
    gameId = nextGameId++;
    const game = new Game(light, gameId, req.userId, waitingUserId);
    currentGames.push(game);
    userTimeouts[req.userId] = setTimeout(() => {
      currentGames.splice(currentGames.indexOf(game), 1);
    }, 30000);
  }

  const { opponent } = (await documents
    .get({
      Key: { userId: waitingUserId },
      ExpressionAttributeNames: { '#name': 'name' },
      ProjectionExpression: '#name',
      TableName: tableName,
    })
    .promise()).Item!.name;

  res.json({ gameId, opponent });

  waitingUserId = null;
});

gameRouter.get('/waiting', findGame, async (req, res) => {
  if (req.game == null) {
    res.sendStatus(204);
    return;
  }

  userTimeouts[req.userId] = setTimeout(() => {
    currentGames.splice(currentGames.indexOf(req.game!), 1);
  }, 30000);

  const opponent = (await documents
    .get({
      Key: {
        userId:
          req.userId === req.game.darkId ? req.game.lightId : req.game.darkId,
      },
      ExpressionAttributeNames: { '#name': 'name' },
      ProjectionExpression: '#name',
      TableName: tableName,
    })
    .promise()).Item!.name;

  res.json({ opponent });
});

gameRouter.post('/keep-alive', findGame, (req, res) => {
  clearTimeout(userTimeouts[req.userId]);

  if (req.game == null) {
    res.sendStatus(404);
  }

  userTimeouts[req.userId] = setTimeout(() => {
    currentGames.splice(currentGames.indexOf(req.game!), 1);
  }, 30000);
});

const validateMoveRequest = (body: any): MoveRequest | null => {
  if (typeof body !== 'object') {
    return null;
  }

  const validateCoordinate = (coordinate: any): Coordinate | null => {
    if (typeof coordinate !== 'object') {
      return null;
    }

    if (
      typeof coordinate.row !== 'number' ||
      coordinate.row < 0 ||
      coordinate.row > 7
    ) {
      return null;
    }

    if (
      typeof coordinate.row !== 'number' ||
      coordinate.column < 0 ||
      coordinate.column > 7
    ) {
      return null;
    }

    return { row: coordinate.row, column: coordinate.column };
  };

  const from = validateCoordinate(body.from);

  if (!from) {
    return null;
  }

  const to = validateCoordinate(body.to);

  if (!to) {
    return null;
  }

  return { from, to };
};

gameRouter.get('/turn', findGame, (req, res) => {
  if (!req.game) {
    res.sendStatus(404);
    return;
  }

  const isYourTurn = req.game.currentColor === req.userColor;
  return { isYourTurn, board: isYourTurn ? req.game.board : null };
});

gameRouter.delete('/', findGame, (req, res, next) => {
  if (!req.game) {
    res.sendStatus(404);
    return;
  }

  currentGames.splice(currentGames.indexOf(req.game), 1);
  res.sendStatus(204);
});

gameRouter.post('/move', findGame, async (req, res) => {
  if (req.game == null) {
    res.sendStatus(404);
    return;
  }

  const moveRequest = validateMoveRequest(req.body);
  if (!moveRequest) {
    res.sendStatus(400);
    return;
  }

  const { game, userId, userColor } = req;

  if (userColor !== game.currentColor) {
    res.sendStatus(400);
    return;
  }

  const state = game.move(moveRequest);

  if (!state) {
    res.send(400);
    return;
  }

  if (state === 'done') {
    await Promise.all([
      documents
        .update({
          Key: { userId },
          TableName: tableName,
          UpdateExpression: 'SET wins = wins + :one',
          ExpressionAttributeValues: { ':one': 1 },
        })
        .promise(),
      documents
        .update({
          Key: { userId: userId === game.darkId ? game.lightId : game.darkId },
          TableName: tableName,
          UpdateExpression: 'SET losses = losses + :one',
          ExpressionAttributeValues: { ':one': 1 },
        })
        .promise(),
    ]);
  }

  res.json({ state } as MoveResponse);
});
