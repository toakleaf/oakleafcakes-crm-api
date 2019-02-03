const request = require('supertest');
const db = require('../../../db/db');
const signToken = require('../../../controllers/user/signToken');
const { INITIAL_USER } = require('../../../config');
let server;

describe('user', () => {
  const session = {
    initialToken: signToken(INITIAL_USER.user_id, INITIAL_USER.roll),
    newUser: {
      email: `stub@dfassdf.com`,
      password: 'abcdefghijklmnopqrstuvwxyz',
      role: 'EMPLOYEE',
      first_name: 'John',
      last_name: 'Doe',
      company_name: 'Evil Corp',
      phone: '123-456-7890',
      phone_type: 'mobile'
    },
    newUserLoginID: null,
    newUserID: null,
    newUserToken: null,
    pwResetToken: null
  };

  beforeEach(() => {
    server = require('../../../bin/www');
  });
  afterEach(() => {
    server.close();
  });
  afterAll(() => {
    db.destroy();
  });

  // GET /user
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
    it('should return 200 and valid json with valid token', async () => {
      expect.assertions(2);
      const res = await request(server)
        .get('/user')
        .set('Authorization', `Bearer ${session.initialToken}`);
      expect(res.status).toBe(200);
      expect(res.body.id).not.toBeNull();
    });
  });

  // POST /user/register
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
    it('should return 400 if email or password invalid', async () => {
      expect.assertions(1);
      const res = await request(server)
        .post('/user/register')
        .set('Authorization', `Bearer ${session.initialToken}`)
        .send({ email: 'a', password: 'a' });
      expect(res.status).toBe(400);
    });
    it('should return 200 with valid token and data, even if email is uppercase', async () => {
      expect.assertions(1);
      const res = await request(server)
        .post('/user/register')
        .set('Authorization', `Bearer ${session.initialToken}`)
        .send({
          ...session.newUser,
          email: session.newUser.email.toUpperCase()
        });
      expect(res.status).toBe(200);
      session.newUserID = res.body.id;
      session.newUserToken = res.get('x-auth-token');
    });
    it('session.newUser should exist in user table, even if email case is different', async () => {
      expect.assertions(5);
      const data = await db
        .select('*')
        .from('user')
        .where({ id: session.newUserID });
      expect(data[0].first_name).toBe(session.newUser.first_name);
      expect(data[0].last_name).toBe(session.newUser.last_name);
      expect(data[0].company_name).toBe(session.newUser.company_name);
      const data2 = await db
        .select('*')
        .from('login')
        .where({ user_id: session.newUserID });
      expect(data2[0].email).toBe(session.newUser.email);
      const data3 = await db
        .select('*')
        .from('email')
        .where({ user_id: session.newUserID });
      expect(data3[0].email).toBe(session.newUser.email);
    });
    it('session.newUser should exist in login table, even if email case is different', async () => {
      expect.assertions(3);
      const data = await db
        .select('*')
        .from('login')
        .where({ user_id: session.newUserID });
      session.newUserLoginID = data[0].id;
      expect(data[0]).toHaveProperty('id');
      expect(data[0]).toHaveProperty('hash');
      expect(data[0].email).toBe(session.newUser.email);
    });
  });

  // POST /user/login
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
        .send({ ...session.newUser, password: 'VERYWRONG!!!' });
      expect(res.status).toBe(401);
    });
    it('should return 200 if good credentials', async () => {
      expect.assertions(1);
      const res = await request(server)
        .post('/user/login')
        .send(session.newUser);
      expect(res.status).toBe(200);
    });
  });

  // PUT user/:id
  describe.skip('PUT /user/:id', () => {
    it('should return 405 if not a PUT', async () => {
      expect.assertions(1);
      const res = await request(server).post('/user/blah');
      expect(res.status).toBe(405);
    });
    it('should return 400 with an invalid token', async () => {
      expect.assertions(1);
      const res = await request(server)
        .put('/user/blah')
        .set('Authorization', `Bearer gibberish`);
      expect(res.status).toBe(400);
    });
    it('should return 403 if role !== ADMIN and current user !== params.id', async () => {
      expect.assertions(1);
      const res = await request(server)
        .put('/user/blah')
        .set('Authorization', `Bearer ${session.newUserToken}`)
        .send({
          first_name: 'blah'
        });
      expect(res.status).toBe(403);
    });
    it('should return 200 with valid token and current user === params.id', async () => {
      expect.assertions(1);
      const res = await request(server)
        .put(`/user/${session.newUserID}`)
        .set('Authorization', `Bearer ${session.newUserToken}`)
        .send({
          first_name: 'updated_name',
          password: 'updated_password',
          email: '123@gg.com',
          phone: '987-654-3210',
          phone_type: 'home'
        });
      expect(res.status).toBe(200);
    });
    it('session.newUser should have been updated in user table', async () => {
      expect.assertions(3);
      const data = await db
        .select('*')
        .from('user')
        .where({ id: session.newUserID });
      expect(data[0].first_name).not.toBe(session.newUser.first_name);
      const data2 = await db
        .select('*')
        .from('email')
        .where({ user_id: session.newUserID });
      expect(data2[0].email).not.toBe(session.newUser.email);
      const data3 = await db
        .select('*')
        .from('phone')
        .where({ user_id: session.newUserID });
      expect(data3[0].phone).not.toBe(session.newUser.phone);
    });
    it('session.newUser should have been updated in login table', async () => {
      expect.assertions(1);
      const data = await db
        .select(['created_at', 'updated_at'])
        .from('login')
        .where('user_id', session.newUserID);
      expect(data[0].updated_at).not.toBe(data[0].created_at);
    });
  });

  // POST user/forgot
  describe.skip('POST user/forgot', () => {
    jest.mock('../../../controllers/email/sendMail');
    const sendMail = require('../../../controllers/email/sendMail');
    sendMail.mockResolvedValue({
      accepted: ['97891@google.com'],
      rejected: [],
      envelopeTime: 160,
      messageTime: 553,
      messageSize: 10782,
      response: '250 2.0.0 OK 1547171720 y2sm44725669qtb.88 - gsmtp',
      envelope: { from: 'noreply@test.com', to: ['97891@google.com'] },
      messageId: '<17e409d6-958c-a77e-e63f-40358ae29266@test.com>'
    });
    jest.mock('../../../controllers/email/messages/passwordReset');
    const message = require('../../../controllers/email/messages/passwordReset');

    it('should return 400 if email is invalid', async () => {
      expect.assertions(1);
      const res = await request(server)
        .post('/user/forgot')
        .send({ email: 'a' });
      expect(res.status).toBe(400);
    });
    it('should return 200, but not update the login table if email not found', async () => {
      expect.assertions(2);
      const res = await request(server)
        .post('/user/forgot')
        .send({ email: 'nope@nope.com' });
      expect(res.status).toBe(200);
      const data = await db
        .select('reset_token_hash')
        .from('login')
        .where('user_id', session.newUserID);
      expect(data[0].reset_token_hash).toBeNull();
    });
    it('should return 200, with updates to login table if all is well', async () => {
      expect.assertions(4);
      const res = await request(server)
        .post('/user/forgot')
        .send({ email: session.newUser.email });
      expect(res.status).toBe(200);
      session.pwResetToken = message.mock.calls[0][1];
      const data = await db
        .select('*')
        .from('login')
        .where('user_id', session.newUserID);
      expect(data[0].reset_token_hash).not.toBeNull();
      expect(data[0].reset_token_expiration).not.toBeNull();
      expect(data[0].reset_token_expiration.getTime()).toBeGreaterThan(
        data[0].updated_at.getTime()
      );
    });
  });

  // POST user/reset/:id/:token
  describe.skip('POST user/reset/:id/:token', () => {
    it('should return 405 if not a POST', async () => {
      expect.assertions(1);
      const res = await request(server).put('/user/reset/:id/:token');
      expect(res.status).toBe(405);
    });
    it('should return 400 if password is missing of invalid', async () => {
      expect.assertions(1);
      const res = await request(server)
        .post(`/user/reset/9999/whatever`)
        .send({ password: 'a' });
      expect(res.status).toBe(400);
    });
    it('should return 401 if id is wrong', async () => {
      expect.assertions(1);
      const res = await request(server)
        .post(`/user/reset/9999/${session.pwResetToken}`)
        .send({ password: 'newpasswordoflength' });
      expect(res.status).toBe(401);
    });
    it('should return 401 if token is wrong', async () => {
      expect.assertions(1);
      const res = await request(server)
        .post(`/user/reset/1/wrong`)
        .send({ password: 'newpasswordoflength' });
      expect(res.status).toBe(401);
    });
    it('should return 200 if password reset', async () => {
      expect.assertions(1);
      const res = await request(server)
        .post(`/user/reset/${session.newUserLoginID}/${session.pwResetToken}`)
        .send({ password: 'newpasswordoflength' });
      expect(res.status).toBe(200);
    });
    it('should clear token hash from login table after first call', async () => {
      expect.assertions(2);
      const data = await db
        .select('*')
        .from('login')
        .where('user_id', session.newUserID);
      expect(data[0].reset_token_hash).toBe('');
      expect(data[0].reset_token_expiration).toEqual(data[0].updated_at);
    });
  });

  // GET user/list/?querystring
  describe.skip('GET /user/list', () => {
    it('should return 405 if not a GET', async () => {
      expect.assertions(1);
      const res = await request(server).put('/user/list');
      expect(res.status).toBe(405);
    });
    it('should return 400 with an invalid token', async () => {
      expect.assertions(1);
      const res = await request(server)
        .get('/user/list')
        .set('Authorization', `Bearer gibberish`);
      expect(res.status).toBe(400);
    });
    it('should return 403 if is_admin = false', async () => {
      expect.assertions(1);
      const res = await request(server)
        .get('/user/list')
        .set('Authorization', `Bearer ${session.newUserToken}`)
        .send({
          first_name: 'blah'
        });
      expect(res.status).toBe(403);
    });
    it('should return 400 with an invalid query string', async () => {
      expect.assertions(1);
      const res = await request(server)
        .get('/user/list/?orderby=gibberish')
        .set('Authorization', `Bearer ${session.initialToken}`);
      expect(res.status).toBe(400);
    });
    it('should return 200 with an valid query string', async () => {
      expect.assertions(2);
      const res = await request(server)
        .get('/user/list/?orderby=id&order=desc')
        .set('Authorization', `Bearer ${session.initialToken}`);
      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThanOrEqual(2);
      // 2 because original user + test created user
    });
  });

  // DELETE user/:id
  describe('DELETE /user/:id', () => {
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
    it('should return 403 if role !== ADMIN and current user !== params.id', async () => {
      expect.assertions(1);
      const res = await request(server)
        .delete('/user/blah')
        .set('Authorization', `Bearer ${session.newUserToken}`);
      expect(res.status).toBe(403);
    });
    it('should return 200 with valid token and current user === params.id', async () => {
      expect.assertions(1);
      const res = await request(server)
        .delete(`/user/${session.newUserID}`)
        .set('Authorization', `Bearer ${session.newUserToken}`);
      expect(res.status).toBe(200);
    });
    it('session.newUser should have been deleted from user table', async () => {
      expect.assertions(1);
      const data = await db
        .select('*')
        .from('user')
        .where({ id: session.newUserID });
      expect(data).toHaveLength(0);
    });
    it('session.newUser should have been deleted (via cascade) from login table', async () => {
      expect.assertions(1);
      const data = await db
        .select('*')
        .from('login')
        .where({ user_id: session.newUserID });
      expect(data).toHaveLength(0);
    });
  });
});
