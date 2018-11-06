import 'dotenv/config';
import request, { SuperTest, Test } from 'supertest';

import server from './server';

export const testUserId = 'supertest user';

export const createSuperTest = () => request.agent(server);
