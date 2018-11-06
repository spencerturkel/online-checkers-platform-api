import 'dotenv/config';
import request, { SuperTest, Test } from 'supertest';

import server from '../server';

const testUserId = 'supertest user';

describe('auth router', () => {
  let test: SuperTest<Test>;

  beforeEach(() => {
    test = request.agent(server);
  });

  it('authenticates at /local', async () => {
    await test.get('/user').expect(403);
    await test
      .post('/auth/local')
      .send({ id: testUserId })
      .expect(201);
    await test
      .get('/user')
      .expect(200)
      .expect(res => {
        expect(res.body).toEqual(
          expect.objectContaining({
            name: expect.stringContaining(testUserId),
            userId: testUserId,
          }),
        );
        expect(typeof res.body.isPremium).toBe('boolean');
        expect(res.body.wins).toBeGreaterThanOrEqual(0);
        expect(res.body.losses).toBeGreaterThanOrEqual(0);
      });
  });
});
