import uuid from 'uuid/v4';

import { createSuperTest, SuperTest, Test, testUserId } from '../supertest';

jest.setTimeout(10000);

describe('auth router', () => {
  let test: SuperTest<Test>;

  beforeEach(() => {
    test = createSuperTest();
  });

  it('authenticates guests at /guest', async () => {
    const name = uuid();
    await test
      .post('/auth/guest')
      .send({ name })
      .expect(201);
    test
      .get('/user')
      .expect(200)
      .expect(({ body }) =>
        expect(body).toEqual({
          isPremium: false,
          losses: 0,
          name,
          userId: expect.any(String),
          wins: 0,
        }),
      );
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
