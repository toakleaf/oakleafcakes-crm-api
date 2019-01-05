const request = require('supertest');
let server;

describe('app', () => {
  beforeEach(() => {
    server = require('../../bin/www');
  });
  afterEach(() => {
    server.close();
  });
  describe('Negative Cases', () => {
    it('should return 404', async () => {
      expect.assertions(1);
      const res = await request(server).get('/asdgasdgasddg');
      expect(res.status).toBe(404);
    });
  });
});
