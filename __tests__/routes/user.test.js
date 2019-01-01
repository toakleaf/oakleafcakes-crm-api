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
    it('should return 401 if email not found', async () => {
      const res = await request(server)
        .post('/user/login')
        .send({ email: 'jibberish' })
        .expect(401);
    });
    it('should return 401 if password hash not matched', async () => {
      const res = await request(server)
        .post('/user/login')
        .send({ email: 'a@a.com', password: 'wrong' })
        .expect(401);
    });
    it('should return 200 if good credentials', async () => {
      const res = await request(server)
        .post('/user/login')
        .send({ email: 'a@a.com', password: 'a' })
        .expect(200);
    });
  });
});
