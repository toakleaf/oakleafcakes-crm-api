const request = require('supertest');
let server;

describe('customer', () => {
  beforeEach(() => {
    server = require('../../bin/www');
  });
  afterEach(() => {
    server.close();
  });
  describe('GET /customer', () => {
    it('should return 200', async () => {
      const res = await request(server).get('/customer');
      expect(res.status).toBe(200);
    });
  });
});
