const request = require('supertest');
const db = require('../../db/db');
const signToken = require('../../controllers/signToken');
const { INITIAL_USER } = require('../../config');
let server;

describe('user', () => {
  const token1 = signToken(INITIAL_USER.user_id, INITIAL_USER.is_admin);
  const random_number = Math.floor(Math.random() * 10000000);
  let newUserID = null;
  const newUser = {
    email: `${random_number}@google.com`,
    password: 'abcdefghij',
    is_admin: false,
    first_name: 'John',
    last_name: 'Doe',
    display_name: 'jdoe'
  };
  let token2 = null;
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
    it('should return 405 if not a GET', async () => {
      expect.assertions(1);
      const res = await request(server).post('/user');
      expect(res.status).toBe(405);
    });
    it('should return 401 with no token', async () => {
      expect.assertions(1);
      const res = await request(server).get('/user');
      expect(res.status).toBe(401);
    });
    it('should return 400 with an invalid token', async () => {
      expect.assertions(1);
      const res = await request(server)
        .get('/user')
        .set('Authorization', `Bearer gibberish`);
      expect(res.status).toBe(400);
    });
    it('should return 200 with valid token', async () => {
      expect.assertions(1);
      const res = await request(server)
        .get('/user')
        .set('Authorization', `Bearer ${token1}`);
      expect(res.status).toBe(200);
    });
  });

  describe('POST /user/login', () => {
    it('should return 405 if not a POST', async () => {
      expect.assertions(1);
      const res = await request(server).get('/user/login');
      expect(res.status).toBe(405);
    });
    it('should return 400 if email or password invalid', async () => {
      expect.assertions(1);
      const res = await request(server)
        .post('/user/login')
        .send({ email: 'a', password: 'a' });
      expect(res.status).toBe(400);
    });
    it('should return 401 if email not found', async () => {
      expect.assertions(1);
      const res = await request(server)
        .post('/user/login')
        .send({ email: 'jibberish@blah.com', password: 'VERYWRONG!!' });
      expect(res.status).toBe(401);
    });
    it('should return 401 if password hash not matched', async () => {
      expect.assertions(1);
      const res = await request(server)
        .post('/user/login')
        .send({ ...INITIAL_USER, password: 'VERYWRONG!!!' });
      expect(res.status).toBe(401);
    });
    it('should return 200 if good credentials', async () => {
      expect.assertions(1);
      const res = await request(server)
        .post('/user/login')
        .send(INITIAL_USER);
      expect(res.status).toBe(200);
    });
  });

  describe('POST /user/register', () => {
    it('should return 405 if not a POST', async () => {
      expect.assertions(1);
      const res = await request(server).get('/user/register');
      expect(res.status).toBe(405);
    });
    it('should return 401 with no token', async () => {
      expect.assertions(1);
      const res = await request(server).post('/user/register');
      expect(res.status).toBe(401);
    });
    it('should return 400 with an invalid token', async () => {
      expect.assertions(1);
      const res = await request(server)
        .post('/user/register')
        .set('Authorization', `Bearer gibberish`);
      expect(res.status).toBe(400);
    });
    it('should return 200 with valid token', async () => {
      expect.assertions(1);
      const res = await request(server)
        .post('/user/register')
        .set('Authorization', `Bearer ${token1}`)
        .send(newUser);
      expect(res.status).toBe(200);
      newUserID = res.get('X-Created-User');
      token2 = signToken(newUserID, false);
    });
    it('should return 403 if is_admin = false', async () => {
      expect.assertions(1);
      const res = await request(server)
        .post('/user/register')
        .set('Authorization', `Bearer ${token2}`)
        .send({
          email: `${random_number + 1}@z.com`,
          password: 'z',
          is_admin: false
        });
      expect(res.status).toBe(403);
    });
    it('newUser should exist in db', async () => {
      expect.assertions(4);
      const data = await db
        .select('*')
        .from('user')
        .where({ id: newUserID });
      expect(data[0].first_name).toBe(newUser.first_name);
      expect(data[0].last_name).toBe(newUser.last_name);
      expect(data[0].email).toBe(newUser.email);
      expect(data[0].display_name).toBe(newUser.display_name);
    });
  });

  describe('DELETE /user/:id', () => {
    it('should return 405 if not a DELETE', async () => {
      expect.assertions(1);
      const res = await request(server).get('/user/blah');
      expect(res.status).toBe(405);
    });
    it('should return 401 with no token', async () => {
      expect.assertions(1);
      const res = await request(server).delete('/user/blah');
      expect(res.status).toBe(401);
    });
    it('should return 400 with an invalid token', async () => {
      expect.assertions(1);
      const res = await request(server)
        .delete('/user/blah')
        .set('Authorization', `Bearer gibberish`);
      expect(res.status).toBe(400);
    });
    it('should return 403 if is_admin = false and current user !== params.id', async () => {
      expect.assertions(1);
      const res = await request(server)
        .delete('/user/blah')
        .set('Authorization', `Bearer ${token2}`)
        .send({
          email: `${random_number + 1}@z.com`,
          password: 'z',
          is_admin: false
        });
      expect(res.status).toBe(403);
    });
    it('should return 200 with valid token and current user === params.id', async () => {
      expect.assertions(1);
      const res = await request(server)
        .delete(`/user/${newUserID}`)
        .set('Authorization', `Bearer ${token2}`)
        .send(newUser);
      expect(res.status).toBe(200);
    });
    it('newUser should NOT exist in db', async () => {
      expect.assertions(1);
      const data = await db
        .select('*')
        .from('user')
        .where({ id: newUserID });
      expect(data).toHaveLength(0);
    });
  });
});
