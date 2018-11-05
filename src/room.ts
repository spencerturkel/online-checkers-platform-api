import { Router, RequestHandler } from 'express';

import { authenticate } from './auth/middleware';
import { Game } from './game/game';

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

roomRouter.use((req, res, next) => {
  req.room = roomsByUserId[req.userId];

  req.roomUser =
    req.userId === req.room.challenger.id
      ? req.room.challenger
      : req.room.opponent!;

  clearTimeout(req.roomUser.timer);
  req.roomUser.timer = setTimeout(() => {
    removeUser(req.room, req.roomUser.id);
  }, 30000);

  next();
});

const roomsByUserId = {} as { [userId: string]: Room };

roomRouter.post('/create', (req, res) => {
  if (req.room != null) {
    res.sendStatus(204);
    return;
  }

  roomsByUserId[req.userId] = {
    challenger: {
      id: req.userId,
      name: '', // TODO: get name
      timer: setTimeout(() => {
        removeUser(req.room, req.roomUser.id);
      }, 30000),
    },
  };

  // TODO: email the opponent if email in req.body
});

const removeUser = (room: Room, userId: string): void => {
  if (room.opponent) {
    if (room.opponent.id === userId) {
      room.opponent = undefined;
    } else {
      room.challenger = room.opponent;
    }
  }
  delete roomsByUserId[userId];
};

roomRouter.post('/leave', (req, res) => {
  if (!req.room) {
    res.sendStatus(404);
    return;
  }

  removeUser(req.room, req.userId);
  res.sendStatus(204);
});

roomRouter.get('/', (req, res) => {
  const room = roomsByUserId[req.userId];
  if (room == null) {
    res.sendStatus(404);
    return;
  }

  if (room.opponent != null) {
    if (room.opponent.id === req.userId) {
      res.json({ name: room.challenger.name });
      return;
    }

    res.json({ name: room.opponent.name });
  }
});
