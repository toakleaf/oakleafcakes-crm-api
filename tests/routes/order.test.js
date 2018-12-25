const request = require('supertest');
let server;

describe('order', () => {
  beforeEach(() => {
    server = require('../../bin/www');
  });
  afterEach(() => {
    server.close();
  });
  describe('GET /order', () => {
    it('should return 200', async () => {
      const res = await request(server).get('/order');
      expect(res.status).toBe(200);
    });
  });
});
