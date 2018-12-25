const request = require('supertest');
let server;

describe('user', () => {
  beforeEach(() => {
    server = require('../../bin/www');
  });
  afterEach(() => {
    server.close();
  });
  describe('GET /user', () => {
    it('should return 200', async () => {
      const res = await request(server).get('/user');
      expect(res.status).toBe(200);
    });
  });
});
