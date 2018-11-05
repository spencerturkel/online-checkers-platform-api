import { Router } from 'express';

import { authenticate } from './auth/middleware';
import { documents, tableName } from './dynamo';
import { Game } from './game/game';
import { logger } from './logger';

export const roomRouter = Router();

roomRouter.use(authenticate);

interface RoomUser {
  id: string;
  name: string;
  timer: NodeJS.Timer;
}

interface WaitingState {
  public: boolean;
  name: 'waiting';
}

type Decision = 'challenger' | 'opponent' | 'random';

interface DecidingState {
  name: 'deciding';
  challengerDecision?: Decision;
  opponent: RoomUser;
  opponentDecision?: Decision;
  previousWinnerId?: string;
}

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
      room?: Room;
    }
  }
}

const roomUserTimeout = Number(process.env.ROOM_USER_TIMEOUT) || 30000;

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
    logger.info(`No Room for user ${req.userId}`);
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

const roomsByUserId = {} as { [userId: string]: Room };

const setRoomUserName = async (user: RoomUser) => {
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

roomRouter.post('/join/:id', async (req, res) => {
  if (req.room) {
    if (!req.params.id) {
      logger.debug(
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

  if (req.params.id) {
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
      res.sendStatus(204);
      setRoomUserName(opponent);
      return;
    }
  }

  res.sendStatus(404);
});

roomRouter.post('/leave', (req, res) => {
  if (!req.room) {
    logger.debug('User %s attempted to leave non-existent room', req.userId);
    res.sendStatus(404);
    return;
  }

  removeUser(req.room, req.userId);
  res.sendStatus(204);
});

roomRouter.get('/', (req, res) => {
  if (req.room == null) {
    logger.debug('User %s attempted to get non-existent room', req.userId);
    res.sendStatus(404);
    return;
  }

  res.json(req.room);
});
