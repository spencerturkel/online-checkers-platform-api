import { Router } from 'express';

import { authenticate } from '../auth/middleware';
import { documents, tableName } from '../dynamo';

export const gameRouter = Router();

gameRouter.use(authenticate);

let waitingUserId: string | null = null;

interface GameState {
  digit: number;
  id: number;
  playerOneId: string;
  playerTwoId: string;
}

const games: { [gameId: number]: GameState } = {};
let nextGameId = 0;

gameRouter.post('/start', async (req, res) => {
  const currentUserId = req.session!.userId;

  const existingGame = Object.values(games).find(x =>
    [x.playerOneId, x.playerTwoId].includes(currentUserId),
  );

  let gameId;

  if (existingGame) {
    gameId = existingGame.id;
  } else {
    if (waitingUserId === null) {
      waitingUserId = currentUserId;
      res.sendStatus(204);
      return;
    }

    if (waitingUserId === currentUserId) {
      res.sendStatus(400);
      return;
    }

    gameId = nextGameId++;

    games[gameId] = {
      digit: Math.floor(Math.random() * 10),
      id: gameId,
      playerOneId: currentUserId,
      playerTwoId: waitingUserId,
    };
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

gameRouter.get('/waiting', async (req, res) => {
  const userId = req.session!.userId;
  const game = Object.values(games).find(
    x => x.playerOneId === userId || x.playerTwoId === userId,
  );

  if (game == null) {
    res.sendStatus(204);
    return;
  }

  const opponent = (await documents
    .get({
      Key: {
        userId:
          userId === game.playerOneId ? game.playerTwoId : game.playerOneId,
      },
      ExpressionAttributeNames: { '#name': 'name' },
      ProjectionExpression: '#name',
      TableName: tableName,
    })
    .promise()).Item!.name;

  res.json({ opponent });
});

gameRouter.post('/guess', async (req, res) => {
  if (!req.body || !Object.keys(req.body).includes('digit')) {
    res.sendStatus(400);
    return;
  }

  const digit = Number(req.body.digit);

  if (isNaN(digit)) {
    res.sendStatus(400);
    return;
  }

  const userId = req.session!.userId;
  const game = Object.values(games).find(
    x => x.playerOneId === userId || x.playerTwoId === userId,
  );

  if (game == null) {
    res.sendStatus(404);
    return;
  }

  if (digit !== game.digit) {
    res.json({ correct: false });
    return;
  }

  delete games[game.id];
  await documents
    .update({
      Key: { userId },
      TableName: tableName,
      UpdateExpression: 'SET wins = wins + :one',
      ExpressionAttributeValues: { ':one': 1 },
    })
    .promise();
  res.json({ correct: true });
});
