import { dark, light } from './game';
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

    afterEach(async () => {
      await Promise.all([
        clientOne.post('/room/leave'),
        clientTwo.post('/room/leave'),
      ]);
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

    it('may be joined using the invitation token after inviting', async () => {
      await clientOne
        .post('/room/invite')
        .send({ email: 'bit-bucket@test.smtp.org' })
        .expect(204);

      const token = await clientOne.get('/room').then(
        ({
          body: {
            state: { invitationToken },
          },
        }) => invitationToken,
      );

      await clientTwo
        .post('/room/join')
        .send({ token })
        .expect(204);

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

    describe('leaving', () => {
      afterEach(async () => {
        await Promise.all([
          clientOne
            .post('/room/leave')
            .then(() => clientOne.post('/room/create'))
            .then(() => clientOne.post('/room/publish')),
          clientTwo.post('/room/leave'),
        ]);

        await clientTwo.post('/room/join');
      });

      it('allows the challenger to leave', async () => {
        await clientTwo.post('/room/leave').expect(204);
        await clientOne
          .get('/room')
          .expect(200)
          .expect(({ body }) =>
            expect(body).toEqual(
              expect.objectContaining({
                challenger: expect.objectContaining({
                  id: testUserId,
                }),
                state: {
                  public: false,
                  name: 'waiting',
                },
              }),
            ),
          );
      });

      it('allows the opponent to leave', async () => {
        await clientOne.post('/room/leave').expect(204);
        await clientTwo
          .get('/room')
          .expect(200)
          .expect(({ body }) =>
            expect(body).toEqual(
              expect.objectContaining({
                challenger: expect.objectContaining({
                  id: secondTestUserId,
                }),
                state: {
                  public: false,
                  name: 'waiting',
                },
              }),
            ),
          );
      });
    });

    test('decisions may be deleted', async () => {
      await clientOne
        .post('/room/decision')
        .send({ decision: 'challenger' })
        .expect(204);
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

    describe('agreements', () => {
      test.each`
        decision        | firstColor
        ${'challenger'} | ${dark}
        ${'opponent'}   | ${light}
      `(
        'both deciding $decision lets that player go first',
        async ({ decision, firstColor }) => {
          await Promise.all([
            clientOne
              .post('/room/decision')
              .send({ decision })
              .expect(204),
            clientTwo
              .post('/room/decision')
              .send({ decision })
              .expect(204),
          ]);

          await clientOne
            .get('/room')
            .expect(200)
            .expect(({ body }) => {
              expect(body).toEqual(
                expect.objectContaining({
                  state: expect.objectContaining({
                    name: 'playing',
                    game: expect.objectContaining({
                      currentColor: firstColor,
                    }),
                  }),
                }),
              );
            });
        },
      );

      afterEach(async () => {
        await Promise.all([
          clientOne.post('/room/leave'),
          clientTwo.post('/room/leave'),
        ]);
        await clientOne.post('/room/create');
        await clientOne.post('/room/publish');
        await clientTwo.post('/room/join');
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

  describe('game rooms', () => {
    beforeEach(async () => {
      await clientOne.post('/room/create');
      await clientOne.post('/room/publish');
      await clientTwo.post('/room/join');
      await Promise.all([
        clientOne.post('/room/decision').send({ decision: 'challenger' }),
        clientTwo.post('/room/decision').send({ decision: 'challenger' }),
      ]);
    });

    afterEach(async () => {
      await clientTwo.post('/room/leave');
      await clientOne.post('/room/leave');
    });

    it('allows the challenger to leave', async () => {
      await clientTwo.post('/room/leave').expect(204);
      await clientOne
        .get('/room')
        .expect(200)
        .expect(({ body }) =>
          expect(body).toEqual(
            expect.objectContaining({
              challenger: expect.objectContaining({
                id: testUserId,
              }),
              state: {
                public: false,
                name: 'waiting',
              },
            }),
          ),
        );
    });

    it('allows the opponent to leave', async () => {
      await clientOne.post('/room/leave').expect(204);
      await clientTwo
        .get('/room')
        .expect(200)
        .expect(({ body }) =>
          expect(body).toEqual(
            expect.objectContaining({
              challenger: expect.objectContaining({
                id: secondTestUserId,
              }),
              state: {
                public: false,
                name: 'waiting',
              },
            }),
          ),
        );
    });

    it("prevents light from moving dark pieces on dark's turn", async () => {
      await clientTwo
        .post('/room/move')
        .send({ from: { row: 5, column: 0 }, to: { row: 4, column: 1 } })
        .expect(400);
    });

    it("prevents dark from moving light pieces on light's turn", async () => {
      await clientOne
        .post('/room/move')
        .send({ from: { row: 2, column: 1 }, to: { row: 3, column: 0 } })
        .expect(200);
      await clientOne
        .post('/room/move')
        .send({ from: { row: 5, column: 0 }, to: { row: 4, column: 1 } })
        .expect(400);
    });

    it.each`
      colorName  | getClient          | winnerId
      ${'light'} | ${() => clientOne} | ${testUserId}
      ${'dark'}  | ${() => clientTwo} | ${secondTestUserId}
    `(
      'becomes a deciding room with $colorName as the previous winner after $colorName wins',
      async ({ getClient, winnerId }) => {
        /* Infeasible to play a whole game of checkers here.
         As a shortcut there are two development-only endpoints.
         /room/set-my-turn sets the current turn to the requesting player.
         /room/prepare-win clears the board except for a king of the requester's
         color at (0, 0), and one of their opponent's pieces at (1, 1).
       */
        const client = getClient();
        await client.post('/room/set-my-turn').expect(204);
        await client.post('/room/prepare-win').expect(204);
        await client
          .post('/room/move')
          .send({ from: { row: 0, column: 0 }, to: { row: 2, column: 2 } })
          .expect(200);
        await clientOne
          .get('/room')
          .expect(200)
          .expect(({ body }) => {
            expect(body).toEqual(
              expect.objectContaining({
                challenger: expect.objectContaining({
                  id: testUserId,
                }),
                state: {
                  challengerDecision: null,
                  name: 'deciding',
                  opponent: expect.objectContaining({
                    id: secondTestUserId,
                  }),
                  opponentDecision: null,
                  previousWinnerId: winnerId,
                },
              }),
            );
          });
      },
    );
  });
});
