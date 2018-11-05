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

interface Room {
  challenger: RoomUser;
  game?: Game;
  opponent?: RoomUser;
}

declare global {
  namespace Express {
    interface Request {
      room: Room;
      roomUser: RoomUser;
    }
  }
}

const roomUserTimeout = Number(process.env.ROOM_USER_TIMEOUT) || 30000;

roomRouter.use((req, res, next) => {
  req.room = roomsByUserId[req.userId];

  if (!req.room) {
    logger.info(`No Room for user ${req.userId}`);
    next();
    return;
  }

  req.roomUser =
    req.userId === req.room.challenger.id
      ? req.room.challenger
      : req.room.opponent!;

  logger.info(`Room User ${req.roomUser.id}`);

  clearTimeout(req.roomUser.timer);
  req.roomUser.timer = setTimeout(() => {
    logger.info(`Timing out user ${req.roomUser.id}`);
    removeUser(req.room, req.roomUser.id);
  }, roomUserTimeout);

  next();
});

const roomsByUserId = {} as { [userId: string]: Room };

roomRouter.post('/create', async (req, res) => {
  if (req.room != null) {
    logger.debug('Room already created for user %s', req.userId);
    res.sendStatus(204);
    return;
  }

  const challenger = {
    id: req.userId,
    name: '',
    timer: setTimeout(() => {
      logger.info('Timing out user %s', req.userId);
      removeUser(req.room, req.roomUser.id);
    }, roomUserTimeout),
  };

  roomsByUserId[req.userId] = { challenger };

  res.sendStatus(204);
  logger.info('Created room for user %s', challenger.id);

  try {
    challenger.name = (await documents
      .get({
        Key: { userId: req.userId },
        ExpressionAttributeNames: { '#name': 'name' },
        ProjectionExpression: '#name',
        TableName: tableName,
      })
      .promise()).Item!.name;

    logger.debug('Retrieved name of challenger %s', challenger.name);
  } catch (e) {
    logger.error(
      'Error retrieving name of challenger %s : %s',
      challenger.id,
      e instanceof Error ? e.message : e,
    );
  }
});

const removeUser = (room: Room, userId: string): void => {
  if (room.opponent) {
    if (room.opponent.id === userId) {
      room.opponent = undefined;
    } else {
      room.challenger = room.opponent;
      logger.info('User %s became challenger', room.challenger.id);
    }
  }

  delete roomsByUserId[userId];
  logger.info('Removed user %s from room', userId);
};

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

  if (req.room.opponent != null) {
    if (req.room.opponent.id === req.userId) {
      res.json({ name: req.room.challenger.name });
      return;
    }

    res.json({ name: req.room.opponent.name });
  }
});
