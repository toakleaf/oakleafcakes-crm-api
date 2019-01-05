const request = require('supertest');
let server;

describe('search', () => {
  beforeEach(() => {
    server = require('../../bin/www');
  });
  afterEach(() => {
    server.close();
  });
  describe('GET /search', () => {
    it('should return 200', async () => {
      expect.assertions(1);
      const res = await request(server).get('/search');
      expect(res.status).toBe(200);
    });
  });
});
