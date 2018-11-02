import { Router } from 'express';

import { authenticate } from '../auth/middleware';
import { documents, tableName } from '../dynamo';

export const gameRouter = Router();

gameRouter.use(authenticate);

let waitingUserId: string | null = null;

interface Coordinate {
  row: number;
  column: number;
}
interface MoveRequest {
  from: Coordinate;
  to: Coordinate;
}
type State = 'promoted' | 'jumping' | 'done' | 'win' | 'lose';
interface MoveResponse {
  state: State;
}
type Piece = 'RK' | 'BK' | 'R' | 'B';
type Space = Piece | null;
type Board = Space[][];

class Game {
  private readonly jumping: boolean = false;

  constructor(
    private readonly board: Board,
    private readonly currentPlayerId: string,
    readonly id: number,
    readonly playerOneId: string,
    readonly playerTwoId: string,
  ) {}

  move(move: MoveRequest): State | null {
    const piece = this.board[move.from.row][move.from.column];

    if (piece == null) {
      return null;
    }

    return 'done';
  }
}

const games: { [gameId: number]: Game } = {};
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

    games[gameId] = new Game(
      [
        [null, 'B', null, 'B', null, 'B', null, 'B'],
        ['B', null, 'B', null, 'B', null, 'B', null],
        [null, 'B', null, 'B', null, 'B', null, 'B'],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        ['R', null, 'R', null, 'R', null, 'R', null],
        [null, 'R', null, 'R', null, 'R', null, 'R'],
        ['R', null, 'R', null, 'R', null, 'R', null],
      ],
      currentUserId,
      gameId,
      currentUserId,
      waitingUserId,
    );
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

gameRouter.post('/move', async (req, res) => {
  const moveRequest = validateMoveRequest(req.body);
  if (!moveRequest) {
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

  const state = game.move(moveRequest);

  if (!state) {
    res.send(400);
    return;
  }

  if (state === 'done') {
    delete games[game.id];
    await documents
      .update({
        Key: { userId },
        TableName: tableName,
        UpdateExpression: 'SET wins = wins + :one',
        ExpressionAttributeValues: { ':one': 1 },
      })
      .promise();
  }

  res.json({ state } as MoveResponse);
});
