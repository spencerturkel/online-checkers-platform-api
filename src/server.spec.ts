import request, { Test } from 'supertest';

import server from './server';

const localUrl = 'http://localhost:8080';
const liveUrl = 'https://onlinecheckersplatform.com';
const insecureLiveUrl = 'http://onlinecheckersplatform.com';

describe('cors', () => {
  let test: Test;

  beforeEach(() => {
    test = request(server).get('/');
  });

  it(`allows ${localUrl}`, async () => {
    await test
      .set('origin', localUrl)
      .expect('Access-Control-Allow-Origin', localUrl);
  });
  it(`allows ${liveUrl}`, async () => {
    await test
      .set('origin', liveUrl)
      .expect('Access-Control-Allow-Origin', liveUrl);
  });
  it(`disallows ${insecureLiveUrl}`, async () => {
    await test.set('origin', insecureLiveUrl).expect(response => {
      expect(response.get('Access-Control-Allow-Control')).toBeFalsy();
    });
  });
});
