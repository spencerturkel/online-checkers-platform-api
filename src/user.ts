import { Request, Router } from 'express';
import Stripe from 'stripe';

import { authenticate } from './auth/middleware';
import { documents, tableName } from './dynamo';
import { environment } from './environment';

export interface User {
  userId: string;
  isPremium: boolean;
  name: string;
  wins: number;
  losses: number;
}

export const userRouter = Router();

userRouter.use(authenticate);

userRouter.get('/', async (req: Request, res) => {
  const { userId } = req.session!;

  res.json(
    (await documents.get({ Key: { userId }, TableName: tableName }).promise())
      .Item,
  );
});

const stripe = new Stripe(process.env.STRIPE_KEY!);

userRouter.post('/upgrade', async (req, res) => {
  if (
    !req.body ||
    (req.body.stripeEmail != null &&
      typeof req.body.stripeEmail !== 'string') ||
    typeof req.body.stripeToken !== 'string'
  ) {
    console.warn('request error', req.body);
    res.sendStatus(400);
    return;
  }

  let customer: Stripe.customers.ICustomer;
  try {
    customer = await stripe.customers.create({
      email: req.body.stripeEmail as string | undefined,
      source: req.body.stripeToken as string,
    });
  } catch (e) {
    console.warn('stripe error', { e, body: req.body });
    res.sendStatus(400);
    return;
  }

  await stripe.charges.create({
    amount: 50,
    customer: customer.id,
    currency: 'usd',
    description: 'Premium Upgrade',
  });

  await documents
    .update({
      Key: { userId: req.session!.userId },
      TableName: tableName,
      UpdateExpression: 'SET isPremium = :true',
      ExpressionAttributeValues: { ':true': true },
    })
    .promise();

  res.sendStatus(204);
});

if (!environment.production) {
  userRouter.delete('/upgrade', async (req, res) => {
    await documents
      .update({
        Key: { userId: req.session!.userId },
        TableName: tableName,
        UpdateExpression: 'SET isPremium = :false',
        ExpressionAttributeValues: { ':false': false },
      })
      .promise();

    res.sendStatus(204);
  });
}
