import { roomRouter } from './room';
import { createSuperTest, SuperTest, Test, testUserId } from './supertest';

jest.useFakeTimers();

const secondTestUserId = 'supertest user 2';
const thirdTestUserId = 'supertest user 3';

describe('room router', () => {
  let test: SuperTest<Test>;

  beforeEach(async () => {
    test = createSuperTest();
  });

  describe('creating rooms', () => {
    it('requires authentication', async () => {
      await test.post('/room/create').expect(403);
    });

    it('can create many rooms', async () => {
      const testTwo = createSuperTest();
      const testThree = createSuperTest();

      await Promise.all([
        test
          .post('/auth/local')
          .send({ id: testUserId })
          .expect(201),
        testTwo
          .post('/auth/local')
          .send({ id: secondTestUserId })
          .expect(201),
        testThree
          .post('/auth/local')
          .send({ id: thirdTestUserId })
          .expect(201),
      ]);

      await Promise.all([
        test.post('/room/create').expect(204),
        testTwo.post('/room/create').expect(204),
        testThree.post('/room/create').expect(204),
      ]);

      await Promise.all(
        ([
          [test, testUserId],
          [testTwo, secondTestUserId],
          [testThree, thirdTestUserId],
        ] as Array<[SuperTest<Test>, string]>).map(([testInstance, userId]) =>
          testInstance
            .get('/room/')
            .expect(200)
            .expect(({ body }) => {
              expect(body).toEqual(
                expect.objectContaining({
                  challenger: expect.objectContaining({
                    id: userId,
                    name: expect.any(String),
                  }),
                  state: {
                    name: 'waiting',
                    public: false,
                  },
                }),
              );
            }),
        ),
      );
    });
  });

  describe('waiting rooms', () => {
    beforeEach(async () => {
      await test
        .post('/auth/local')
        .send({ id: testUserId })
        .expect(201);
      await test.post('/room/create').expect(204);
    });

    it('will delete the room after leaving', async () => {
      await test.post('/room/leave').expect(204);
      await test.get('/room').expect(404);
    });

    it('will delete the room after timeout', async () => {
      jest.runAllTimers();
      await test.get('/room').expect(404);
    });

    it('will refresh the timeout after querying', async () => {
      jest.advanceTimersByTime(30000);
      await test.get('/room').expect(404);
      await test.post('/room/create').expect(204);
      jest.advanceTimersByTime(20000);
      await test.get('/room').expect(200);
      jest.advanceTimersByTime(20000);
      await test.get('/room').expect(200);
    });

    it('may be privatized', async () => {
      await test.post('/room/publish').expect(204);
      await test.post('/room/privatize').expect(204);
      await test.get('/room').expect(({ body }) => {
        expect(body).toEqual(
          expect.objectContaining({
            state: {
              name: 'waiting',
              public: false,
            },
          }),
        );
      });
    });

    it('may be published', async () => {
      await test.post('/room/publish').expect(204);
      await test.get('/room').expect(({ body }) => {
        expect(body).toEqual(
          expect.objectContaining({
            state: {
              name: 'waiting',
              public: true,
            },
          }),
        );
      });
    });
  });
});
