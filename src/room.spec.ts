import request, { SuperTest, Test } from 'supertest';
import { roomRouter } from './room';

describe('room router', () => {
  let test: SuperTest<Test>;

  beforeEach(() => {
    test = request(roomRouter);
  });

  it('requires authentication', () => {
    test.get('/').expect(403);
  });
});
