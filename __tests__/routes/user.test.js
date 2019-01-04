const request = require('supertest');
const db = require('../../db/db');
const jwt = require('jsonwebtoken');
const config = require('../../config');
let server;

describe('user', () => {
  beforeEach(() => {
    server = require('../../bin/www');
  });
  afterEach(() => {
    server.close();
  });
  afterAll(() => {
    db.destroy();
  });

  describe('GET /user', () => {
    const token1 = jwt.sign({ user_id: 1, is_admin: true }, config.JWT_KEY, {
      expiresIn: '1h'
    });
    it('should return 401 with no token', async () => {
      const res = await request(server).get('/user');
      expect(res.status).toBe(401);
    });
    it('should return 400 with an invalid token', async () => {
      const res = await request(server)
        .get('/user')
        .set('Authorization', `Bearer gibberish`);
      expect(res.status).toBe(400);
    });
    it('should return 200 with valid token', async () => {
      const res = await request(server)
        .get('/user')
        .set('Authorization', `Bearer ${token1}`);
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
