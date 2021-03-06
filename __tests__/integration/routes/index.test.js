const request = require('supertest');
let server;

describe('index', () => {
  beforeEach(() => {
    server = require('../../../bin/www');
  });
  afterEach(() => {
    server.close();
  });
  describe('GET /', () => {
    it('should return 200', async () => {
      expect.assertions(1);
      const res = await request(server).get('/');
      expect(res.status).toBe(200);
    });
  });
});
