import 'dotenv/config';
import request from 'supertest';

import server from './server';

export const testUserId = 'supertest user';

/**
 * Create a SuperTest agent against the Express server.
 * Handles cookies automatically.
 */
export const createSuperTest = () => request.agent(server);
export { SuperTest, Test } from 'supertest';
