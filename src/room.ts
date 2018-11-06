/**
 * This module defines the Express Router for rooms.
 *
 * Rooms are where users wait for opponents, decide on who will be first,
 * and play games.
 */

import { RequestHandler, Router } from 'express';

import { authenticate } from './auth/middleware';
import { documents, tableName } from './dynamo';
import { environment } from './environment';
import {
  Coordinate,
  dark,
  darkKing,
  Game,
  light,
  lightKing,
  MoveRequest,
  MoveResponse,
} from './game';
import { logger } from './logger';

export const roomRouter = Router();

roomRouter.use(authenticate);

/**
 * The user present in the Room.
 */
interface RoomUser {
  id: string;
  name: string;
  /**
   * When this timer expires, the user will be removed from the Room.
   */
  timer: NodeJS.Timer;
}

/**
 * The Room state where a user is waiting for an opponent.
 */
interface WaitingState {
  /**
   * Whether the waiting user wants to be matched with the public.
   */
  public: boolean;
  name: 'waiting';
}

type Decision = 'challenger' | 'opponent' | 'random';

/**
 * The Room state where the users are deciding who will go first.
 */
interface DecidingState {
  name: 'deciding';
  challengerDecision?: Decision;
  opponent: RoomUser;
  opponentDecision?: Decision;
  /**
   * The ID of the user who won the previous game, if any.
   */
  previousWinnerId?: string;
}

/**
 * The Room state where the users are playing a game.
 */
interface PlayingState {
  name: 'playing';
  game: Game;
  opponent: RoomUser;
}

type RoomState = WaitingState | DecidingState | PlayingState;

interface Room {
  challenger: RoomUser;
  state: RoomState;
}

declare global {
  namespace Express {
    interface Request {
      /**
       * The Room of the requesting user.
       */
      room?: Room;
    }
  }
}

const roomsByUserId = {} as { [userId: string]: Room };

/**
 * After this amount of milliseconds passes without interaction by a RoomUser,
 * that RoomUser will be removed from their Room.
 */
const roomUserTimeout = Number(process.env.ROOM_USER_TIMEOUT) || 30000;

/**
 * Remove a user from a room.
 * @param room the room to remove the user from
 * @param userId the user to be removed
 */
const removeUser = (room: Room, userId: string): void => {
  if (room.state.name !== 'waiting') {
    if (room.state.opponent.id !== userId) {
      room.challenger = room.state.opponent;
      logger.info('User %s became challenger', room.challenger.id);
    }

    room.state = { name: 'waiting', public: false };
  }

  delete roomsByUserId[userId];
  logger.info('Removed user %s from room', userId);
};

roomRouter.use((req, res, next) => {
  req.room = roomsByUserId[req.userId];

  if (req.room == null) {
    logger.info('No Room for user %s', req.userId);
    next();
    return;
  }

  logger.info('Found Room for user %s', req.userId);
  logger.debug('Room: %O', req.room);

  const roomUser =
    req.userId === req.room.challenger.id
      ? req.room.challenger
      : req.room.state.name === 'waiting'
        ? null
        : req.room.state.opponent;

  if (roomUser) {
    clearTimeout(roomUser.timer);
    roomUser.timer = setTimeout(() => {
      logger.info(`Timing out user %s`, req.userId);
      removeUser(req.room!, req.userId);
    }, roomUserTimeout);
  }

  next();
});

/**
 * Sets the name of a RoomUser from DynamoDB.
 * @param user the RoomUser whose name will be set
 */
const setRoomUserName = async (user: RoomUser): Promise<void> => {
  try {
    user.name = (await documents
      .get({
        Key: { userId: user.id },
        ExpressionAttributeNames: { '#name': 'name' },
        ProjectionExpression: '#name',
        TableName: tableName,
      })
      .promise()).Item!.name;

    logger.debug('Retrieved name of user %s: %s', user.id, user.name);
  } catch (e) {
    logger.error(
      'Error retrieving name of user %s : %s',
      user.id,
      e instanceof Error ? e.message : e,
    );
  }
};

/**
 * Create a room for the requesting user.
 */
roomRouter.post('/create', async (req, res) => {
  if (req.room != null) {
    logger.debug('Room already created for user %s', req.userId);
    res.sendStatus(204);
    return;
  }

  const challenger = {
    id: req.userId,
    name: '',
    timer: null!, // will set timer once room created
  };

  const room: Room = {
    challenger,
    state: { name: 'waiting', public: false },
  };

  roomsByUserId[req.userId] = room;

  room.challenger.timer = setTimeout(() => {
    logger.info(`Timing out user %s`, req.userId);
    removeUser(room, req.userId);
  }, roomUserTimeout);

  res.sendStatus(204);
  logger.info('Created room for user %s', challenger.id);
  setRoomUserName(challenger);
});

/**
 * Join a room. If the :id parameter is present, attempts to join that room.
 */
roomRouter.post('/join', async (req, res) => {
  if (req.room) {
    if (typeof req.body !== 'object' || !req.body.id) {
      logger.info(
        'User %s attempting to join any game, but is already in a room',
        req.userId,
      );
      res.sendStatus(204);
      return;
    }

    logger.info(
      'User %s attempting to join a specific game, but is already in a room',
      req.userId,
    );
    res.sendStatus(400);
  }

  if (typeof req.body === 'object' && req.body.id) {
    // TODO: join specific game
    res.sendStatus(500);
    return;
  }

  for (const room of Object.values(roomsByUserId)) {
    if (room.state.name === 'waiting' && room.state.public) {
      const opponent = {
        id: req.userId,
        name: '',
        timer: null!,
      };
      room.state = {
        name: 'deciding',
        opponent,
      };
      roomsByUserId[req.userId] = room;
      res.sendStatus(204);
      setRoomUserName(opponent);
      return;
    }
  }

  res.sendStatus(404);
});

/**
 * Requires that the room is present in the request.
 */
const requireRoom: RequestHandler = (req, res, next) => {
  if (!req.room) {
    logger.info('User %s attempted to act on non-existent room', req.userId);
    res.sendStatus(404);
  } else {
    logger.info('Room for User %s', req.userId);
    next();
  }
};

/**
 * Set a waiting room to be public.
 */
roomRouter.post('/publish', requireRoom, (req, res) => {
  const room = req.room!;

  if (room.state.name !== 'waiting') {
    res.sendStatus(400);
    return;
  }

  room.state.public = true;
  res.sendStatus(204);
});

/**
 * Set a waiting room to be private.
 */
roomRouter.post('/privatize', requireRoom, (req, res) => {
  const room = req.room!;

  if (room.state.name !== 'waiting') {
    res.sendStatus(400);
    return;
  }

  room.state.public = false;
  res.sendStatus(204);
});

roomRouter.post('/leave', requireRoom, (req, res) => {
  removeUser(req.room!, req.userId);
  res.sendStatus(204);
});

roomRouter.get('/', requireRoom, (req, res) => {
  res.json(req.room);
});

roomRouter.post('/first', requireRoom, (req, res) => {
  const room = req.room!;

  if (room.state.name !== 'deciding') {
    logger.info('User %s attempted to decide on non-deciding room', req.userId);
    res.sendStatus(204);
    return;
  }

  const decision = req.body.decision;

  if (
    decision !== 'challenger' &&
    decision !== 'opponent' &&
    decision !== 'random'
  ) {
    res.sendStatus(400);
    return;
  }

  if (req.userId === room.challenger.id) {
    room.state.challengerDecision = decision;
  } else {
    room.state.opponentDecision = decision;
  }

  if (room.state.challengerDecision === room.state.opponentDecision) {
    room.state = {
      game: new Game(
        decision === 'challenger'
          ? dark
          : decision === 'opponent'
            ? light
            : Math.random() >= 0.5
              ? dark
              : light,
        room.challenger.id,
        room.state.opponent.id,
      ),
      name: 'playing',
      opponent: room.state.opponent,
    };
  }

  res.sendStatus(204);
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

roomRouter.post('/move', requireRoom, async (req, res) => {
  const room = req.room!;

  if (room.state.name !== 'playing') {
    logger.info(
      'User %s attempted to move in a %s room',
      req.userId,
      room.state,
    );
    res.sendStatus(400);
    return;
  }

  const moveRequest = validateMoveRequest(req.body);

  if (!moveRequest) {
    res.sendStatus(400);
    return;
  }

  const {
    state: { game },
  } = room;

  if (
    game.currentColor === light
      ? req.userId !== game.lightId
      : req.userId !== game.darkId
  ) {
    res.sendStatus(400);
    return;
  }

  const state = game.move(moveRequest);

  if (!state) {
    res.send(400);
    return;
  }

  res.json({ state } as MoveResponse);

  if (state === 'done') {
    room.state = {
      name: 'deciding',
      opponent: room.state.opponent,
      previousWinnerId: req.userId,
    };

    await Promise.all([
      documents
        .update({
          Key: { userId: req.userId },
          TableName: tableName,
          UpdateExpression: 'SET wins = wins + :one',
          ExpressionAttributeValues: { ':one': 1 },
        })
        .promise()
        .catch(e => {
          logger.error(
            'Error updating wins of user %s : %s',
            req.userId,
            e instanceof Error ? e.message : e,
          );
        }),
      documents
        .update({
          Key: {
            userId: req.userId === game.darkId ? game.lightId : game.darkId,
          },
          TableName: tableName,
          UpdateExpression: 'SET losses = losses + :one',
          ExpressionAttributeValues: { ':one': 1 },
        })
        .promise()
        .catch(e => {
          logger.error(
            'Error updating losses of user %s : %s',
            req.userId === game.darkId ? game.lightId : game.darkId,
            e instanceof Error ? e.message : e,
          );
        }),
    ]);
  }
});

if (!environment.production) {
  roomRouter.post('/prepare-win', requireRoom, (req, res) => {
    const room = req.room!;

    if (room.state.name !== 'playing') {
      res.sendStatus(400);
      return;
    }

    const game = room.state.game;

    game.board = [
      [
        game.currentColor === light ? lightKing : darkKing,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
      ],
      [
        null,
        game.currentColor === light ? dark : light,
        null,
        null,
        null,
        null,
        null,
        null,
      ],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
    ];

    res.sendStatus(204);
  });

  roomRouter.post('/set-my-turn', requireRoom, (req, res) => {
    const room = req.room!;

    if (room.state.name !== 'playing') {
      res.sendStatus(400);
      return;
    }

    room.state.game.currentColor =
      req.userId === room.state.game.lightId ? light : dark;

    res.sendStatus(204);
  });
}
