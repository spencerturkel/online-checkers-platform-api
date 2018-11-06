import 'dotenv/config';
import request from 'supertest';

import server from './server';

export const testUserId = 'supertest user';

export const createSuperTest = () => request.agent(server);
export { SuperTest, Test } from 'supertest';
