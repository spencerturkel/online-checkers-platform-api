import { Router } from 'express';

import { authenticate } from '../auth/middleware';
import { users } from '../user';

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

gameRouter.post('/start', (req, res) => {
  const currentUserId = req.session!.userId;

  if (
    Object.values(games).some(x =>
      [x.playerOneId, x.playerTwoId].includes(currentUserId),
    )
  ) {
    res.sendStatus(400);
    return;
  }

  if (waitingUserId === null) {
    waitingUserId = currentUserId;
    res.sendStatus(204);
    return;
  }

  if (waitingUserId === currentUserId) {
    res.sendStatus(400);
    return;
  }

  const gameId = nextGameId++;

  games[gameId] = {
    digit: Math.floor(Math.random() * 10),
    id: gameId,
    playerOneId: currentUserId,
    playerTwoId: waitingUserId,
  };

  res.json({ gameId, opponent: users.get(waitingUserId)!.name });

  waitingUserId = null;
});

gameRouter.get('/waiting', (req, res) => {
  const userId = req.session!.userId;
  const game = Object.values(games).find(
    x => x.playerOneId === userId || x.playerTwoId === userId,
  );

  if (game == null) {
    res.sendStatus(204);
    return;
  }

  const opponent = users.get(
    userId === game.playerOneId ? game.playerTwoId : game.playerOneId,
  )!.name;

  res.json({ opponent });
});

gameRouter.post('/guess', (req, res) => {
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
  users.get(userId)!.wins++;
  res.json({ correct: true });
});
