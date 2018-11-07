import { roomRouter } from './room';
import { createSuperTest, SuperTest, Test, testUserId } from './supertest';

jest.useFakeTimers();
jest.setTimeout(7000);

const secondTestUserId = 'supertest user 2';
const thirdTestUserId = 'supertest user 3';

describe('room router', () => {
  let clientOne: SuperTest<Test>;
  let clientTwo: SuperTest<Test>;
  let clientThree: SuperTest<Test>;

  beforeAll(async () => {
    clientOne = createSuperTest();
    clientTwo = createSuperTest();
    clientThree = createSuperTest();

    await Promise.all([
      clientOne.post('/auth/local').send({ id: testUserId }),
      clientTwo.post('/auth/local').send({ id: secondTestUserId }),
      clientThree.post('/auth/local').send({ id: thirdTestUserId }),
    ]);
  });

  describe('creating rooms', () => {
    it('requires authentication', async () => {
      await clientOne.delete('/auth');

      try {
        await clientOne.post('/room/create').expect(403);
      } finally {
        await clientOne.post('/auth/local').send({ id: testUserId });
      }
    });

    it('can create many rooms', async () => {
      await Promise.all([
        clientOne.post('/room/create').expect(204),
        clientTwo.post('/room/create').expect(204),
        clientThree.post('/room/create').expect(204),
      ]);

      await Promise.all(
        ([
          [clientOne, testUserId],
          [clientTwo, secondTestUserId],
          [clientThree, thirdTestUserId],
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
      await clientOne.post('/room/create');
    });

    it('will delete the room after leaving', async () => {
      await clientOne.post('/room/leave').expect(204);
      await clientOne.get('/room').expect(404);
    });

    it('will delete the room after timeout', async () => {
      jest.runAllTimers();
      await clientOne.get('/room').expect(404);
    });

    it('will refresh the timeout after querying', async () => {
      jest.advanceTimersByTime(30000);
      await clientOne.get('/room').expect(404);
      await clientOne.post('/room/create').expect(204);
      jest.advanceTimersByTime(20000);
      await clientOne.get('/room').expect(200);
      jest.advanceTimersByTime(20000);
      await clientOne.get('/room').expect(200);
    });

    it('may be privatized', async () => {
      await clientOne.post('/room/publish').expect(204);
      await clientOne.post('/room/privatize').expect(204);
      await clientOne.get('/room').expect(({ body }) => {
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
      await clientOne.post('/room/publish').expect(204);
      await clientOne.get('/room').expect(({ body }) => {
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
      await clientOne.post('/room/privatize').expect(204);
      await clientTwo.post('/room/join').expect(404);
    });

    it('may be joined by anyone if public', async () => {
      await clientOne.post('/room/publish').expect(204);
      await clientTwo.post('/room/join/').expect(204);
      await clientOne
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

  describe('deciding rooms', () => {
    beforeAll(async () => {
      await clientOne.post('/room/create');
      await clientOne.post('/room/publish');
      await clientTwo.post('/room/join');
    });

    test('decisions may be deleted', async () => {
      await clientOne.post('/room/decision').send({ decision: 'challenger' });
      await clientOne.delete('/room/decision').expect(204);
      await clientOne
        .get('/room')
        .expect(200)
        .expect(({ body }) => {
          expect(body).toEqual(
            expect.objectContaining({
              state: expect.objectContaining({
                name: 'deciding',
                challengerDecision: null,
              }),
            }),
          );
        });
    });

    describe('disagreements', () => {
      afterEach(async () => {
        await Promise.all([
          clientOne.delete('/room/decision'),
          clientTwo.delete('/room/decision'),
        ]);
      });

      test.each`
        challengerDecision | opponentDecision
        ${'challenger'}    | ${'opponent'}
        ${'challenger'}    | ${'random'}
        ${'opponent'}      | ${'challenger'}
        ${'opponent'}      | ${'random'}
        ${'random'}        | ${'opponent'}
        ${'random'}        | ${'challenger'}
      `(
        '$challengerDecision != $opponentDecision',
        async ({ challengerDecision, opponentDecision }) => {
          await Promise.all([
            clientOne
              .post('/room/decision')
              .send({ decision: challengerDecision })
              .expect(204),
            clientTwo
              .post('/room/decision')
              .send({ decision: opponentDecision })
              .expect(204),
          ]);
          await clientOne
            .get('/room/')
            .expect(200)
            .expect(({ body }) => {
              expect(body).toEqual(
                expect.objectContaining({
                  state: expect.objectContaining({
                    name: 'deciding',
                    challengerDecision,
                    opponentDecision,
                  }),
                }),
              );
            });
        },
      );
    });
  });
});
