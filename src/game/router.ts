import { Router } from 'express';

import { authenticate } from '../auth/middleware';

export const gameRouter = Router();

gameRouter.use(authenticate);

let waitingUser: string | null = null;

interface GameState {
  playerOneId: string;
  playerTwoId: string;
  letter: string;
}

const games: { [ids: string]: GameState } = {};

gameRouter.post('/start-game', authenticate, (req, res) => {
  if (waitingUser === null) {
    waitingUser = req.session!.userID;
  } else {
    const playerOneId = waitingUser;
    const playerTwoId = req.session!.userId; // TODO: handle same user as waiting
    const letter = 'A'; // TODO: make this a random letter

    games[playerOneId + playerTwoId] = { playerOneId, playerTwoId, letter }; // TODO: better scheme for keying games
  }
});

gameRouter.get('/waiting', authenticate, (req, res) => {
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
