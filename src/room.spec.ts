import { roomRouter } from './room';
import { createSuperTest, SuperTest, Test, testUserId } from './supertest';

jest.useFakeTimers();

const secondTestUserId = 'supertest user 2';
const thirdTestUserId = 'supertest user 3';

describe('room router', () => {
  let testOne: SuperTest<Test>;
  let testTwo: SuperTest<Test>;
  let testThree: SuperTest<Test>;

  describe('creating rooms', () => {
    beforeEach(() => {
      testOne = createSuperTest();
      testTwo = createSuperTest();
      testThree = createSuperTest();
    });

    it('requires authentication', async () => {
      await testOne.post('/room/create').expect(403);
    });

    it('can create many rooms', async () => {
      await Promise.all([
        testOne
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
        testOne.post('/room/create').expect(204),
        testTwo.post('/room/create').expect(204),
        testThree.post('/room/create').expect(204),
      ]);

      await Promise.all(
        ([
          [testOne, testUserId],
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
      testOne = createSuperTest();
      testTwo = createSuperTest();
      testThree = createSuperTest();

      Promise.all([
        await testOne
          .post('/auth/local')
          .send({ id: testUserId })
          .expect(201)
          .then(() => testOne.post('/room/create').expect(204)),
        await testTwo
          .post('/auth/local')
          .send({ id: secondTestUserId })
          .expect(201),
      ]);
    });

    it('will delete the room after leaving', async () => {
      await testOne.post('/room/leave').expect(204);
      await testOne.get('/room').expect(404);
    });

    it('will delete the room after timeout', async () => {
      jest.runAllTimers();
      await testOne.get('/room').expect(404);
    });

    it('will refresh the timeout after querying', async () => {
      jest.advanceTimersByTime(30000);
      await testOne.get('/room').expect(404);
      await testOne.post('/room/create').expect(204);
      jest.advanceTimersByTime(20000);
      await testOne.get('/room').expect(200);
      jest.advanceTimersByTime(20000);
      await testOne.get('/room').expect(200);
    });

    it('may be privatized', async () => {
      await testOne.post('/room/publish').expect(204);
      await testOne.post('/room/privatize').expect(204);
      await testOne.get('/room').expect(({ body }) => {
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
      await testOne.post('/room/publish').expect(204);
      await testOne.get('/room').expect(({ body }) => {
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

    it('may not be joined by anyone if private', async () => {
      await testOne.post('/room/privatize').expect(204);
      await testTwo.post('/room/join').expect(404);
    });

    it('may be joined by anyone if public', async () => {
      await testOne.post('/room/publish').expect(204);
      await testTwo.post('/room/join/').expect(204);
      await testOne
        .get('/room')
        .expect(200)
        .expect(({ body }) => {
          expect(body).toEqual(
            expect.objectContaining({
              challenger: expect.objectContaining({
                id: testUserId,
              }),
              state: expect.objectContaining({
                name: 'deciding',
                opponent: expect.objectContaining({
                  id: secondTestUserId,
                }),
              }),
            }),
          );
        });
    });
  });
});
