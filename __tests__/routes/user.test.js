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

  describe('POST /user/login', () => {
    it('should return 405 if not a POST', async () => {
      const res = await request(server).get('/user/login');
      expect(res.status).toBe(405);
    });
    it('should return 401 if incomplete credentials', async () => {
      const res = await request(server)
        .post('/user/login')
        .send({ email: 'none' })
        .expect(401);
    });
  });
});
