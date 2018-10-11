import { Router } from 'express';

import { authenticate } from '../auth/middleware';
import { users } from '../auth/users';

export const gameRouter = Router();

gameRouter.use(authenticate);

let waitingUser: string | null = null;

interface GameState {
  digit: number;
  id: number;
  playerOneId: string;
  playerTwoId: string;
}

const games: { [gameId: number]: GameState } = {};
let nextGameId = 0;

gameRouter.post('/start', authenticate, (req, res) => {
  const currentUserId = req.session!.userId;
  if (waitingUser === null) {
    waitingUser = currentUserId;
    res.sendStatus(204);
    return;
  }

  if (waitingUser === currentUserId) {
    res.sendStatus(400);
    return;
  }

  const id = nextGameId++;

  games[id] = {
    digit: Math.floor(Math.random() * 10),
    id,
    playerOneId: currentUserId,
    playerTwoId: waitingUser,
  };

  res.json({ id });
});

gameRouter.get('/waiting', authenticate, (req, res) => {
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
  res.send({ gameId: game.id, opponent });
});
