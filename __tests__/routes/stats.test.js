const request = require('supertest');
let server;

describe('stats', () => {
  beforeEach(() => {
    server = require('../../bin/www');
  });
  afterEach(() => {
    server.close();
  });
  describe('GET /stats', () => {
    it('should return 200', async () => {
      const res = await request(server).get('/stats');
      expect(res.status).toBe(200);
    });
  });
});
