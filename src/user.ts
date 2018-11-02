import { Request, Router } from 'express';
import { authenticate } from './auth/middleware';
import { documents, tableName } from './dynamo';

export interface User {
  gameId?: string;
  userId: string;
  isPremium: boolean;
  name: string;
  wins: number;
  losses: number;
}

export const users = new Map<string, User>();

export const userRouter = Router();

userRouter.use(authenticate);

userRouter.get('/', async (req: Request, res) => {
  const { userId } = req.session!;

  res.json(
    (await documents.get({ Key: { userId }, TableName: tableName }).promise())
      .Item,
  );
});
