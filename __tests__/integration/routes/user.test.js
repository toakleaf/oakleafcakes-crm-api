const request = require('supertest');
const db = require('../../../db/db');
const signToken = require('../../../controllers/account/signToken');
const { INITIAL_ACCOUNT } = require('../../../config');
let server;

describe('account', () => {
  const session = {
    initialToken: signToken(INITIAL_ACCOUNT.account_id, INITIAL_ACCOUNT.roll),
    newAccount: {
      email: `stub@dfassdf.com`,
      password: 'abcdefghijklmnopqrstuvwxyz',
      role: 'EMPLOYEE',
      first_name: 'John',
      last_name: 'Doe',
      company_name: 'Evil Corp',
      phone: '123-456-7890',
      phone_type: 'mobile'
    },
    newAccountLoginID: null,
    newAccountID: null,
    newAccountToken: null,
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

  // GET /account
  describe('GET /account', () => {
    it('should return 405 if not a GET', async () => {
      expect.assertions(1);
      const res = await request(server).post('/account');
      expect(res.status).toBe(405);
    });
    it('should return 401 with no token', async () => {
      expect.assertions(1);
      const res = await request(server).get('/account');
      expect(res.status).toBe(401);
    });
    it('should return 400 with an invalid token', async () => {
      expect.assertions(1);
      const res = await request(server)
        .get('/account')
        .set('Authorization', `Bearer gibberish`);
      expect(res.status).toBe(400);
    });
    it('should return 200 and valid json with valid token', async () => {
      expect.assertions(2);
      const res = await request(server)
        .get('/account')
        .set('Authorization', `Bearer ${session.initialToken}`);
      expect(res.status).toBe(200);
      expect(res.body.id).not.toBeNull();
    });
  });

  // POST /account/register
  describe('POST /account/register', () => {
    it('should return 405 if not a POST', async () => {
      expect.assertions(1);
      const res = await request(server).get('/account/register');
      expect(res.status).toBe(405);
    });
    it('should return 401 with no token', async () => {
      expect.assertions(1);
      const res = await request(server).post('/account/register');
      expect(res.status).toBe(401);
    });
    it('should return 400 with an invalid token', async () => {
      expect.assertions(1);
      const res = await request(server)
        .post('/account/register')
        .set('Authorization', `Bearer gibberish`);
      expect(res.status).toBe(400);
    });
    it('should return 400 if email or password invalid', async () => {
      expect.assertions(1);
      const res = await request(server)
        .post('/account/register')
        .set('Authorization', `Bearer ${session.initialToken}`)
        .send({ email: 'a', password: 'a' });
      expect(res.status).toBe(400);
    });
    it('should return 200 with valid token and data, even if email is uppercase', async () => {
      expect.assertions(1);
      const res = await request(server)
        .post('/account/register')
        .set('Authorization', `Bearer ${session.initialToken}`)
        .send({
          ...session.newAccount,
          email: session.newAccount.email.toUpperCase()
        });
      expect(res.status).toBe(200);
      session.newAccountID = res.body.id;
      session.newAccountToken = res.get('x-auth-token');
    });
    it('session.newAccount should exist in account table, even if email case is different', async () => {
      expect.assertions(5);
      const data = await db
        .select('*')
        .from('account')
        .where({ id: session.newAccountID });
      expect(data[0].first_name).toBe(session.newAccount.first_name);
      expect(data[0].last_name).toBe(session.newAccount.last_name);
      expect(data[0].company_name).toBe(session.newAccount.company_name);
      const data2 = await db
        .select('*')
        .from('login')
        .where({ account_id: session.newAccountID });
      expect(data2[0].email).toBe(session.newAccount.email);
      const data3 = await db
        .select('*')
        .from('email')
        .where({ account_id: session.newAccountID });
      expect(data3[0].email).toBe(session.newAccount.email);
    });
    it('session.newAccount should exist in login table, even if email case is different', async () => {
      expect.assertions(3);
      const data = await db
        .select('*')
        .from('login')
        .where({ account_id: session.newAccountID });
      session.newAccountLoginID = data[0].id;
      expect(data[0]).toHaveProperty('id');
      expect(data[0]).toHaveProperty('hash');
      expect(data[0].email).toBe(session.newAccount.email);
    });
  });

  // POST /account/login
  describe('POST /account/login', () => {
    it('should return 405 if not a POST', async () => {
      expect.assertions(1);
      const res = await request(server).get('/account/login');
      expect(res.status).toBe(405);
    });
    it('should return 400 if email or password invalid', async () => {
      expect.assertions(1);
      const res = await request(server)
        .post('/account/login')
        .send({ email: 'a', password: 'a' });
      expect(res.status).toBe(400);
    });
    it('should return 401 if email not found', async () => {
      expect.assertions(1);
      const res = await request(server)
        .post('/account/login')
        .send({ email: 'jibberish@blah.com', password: 'VERYWRONG!!' });
      expect(res.status).toBe(401);
    });
    it('should return 401 if password hash not matched', async () => {
      expect.assertions(1);
      const res = await request(server)
        .post('/account/login')
        .send({ ...session.newAccount, password: 'VERYWRONG!!!' });
      expect(res.status).toBe(401);
    });
    it('should return 200 if good credentials', async () => {
      expect.assertions(1);
      const res = await request(server)
        .post('/account/login')
        .send(session.newAccount);
      expect(res.status).toBe(200);
    });
  });

  // PUT account/:id
  describe('PUT /account/:id', () => {
    it('should return 405 if not a PUT', async () => {
      expect.assertions(1);
      const res = await request(server).post('/account/blah');
      expect(res.status).toBe(405);
    });
    it('should return 400 with an invalid token', async () => {
      expect.assertions(1);
      const res = await request(server)
        .put('/account/1')
        .set('Authorization', `Bearer gibberish`);
      expect(res.status).toBe(400);
    });
    it('should return 400 with an invalid id', async () => {
      expect.assertions(1);
      const res = await request(server)
        .put('/account/blah')
        .set('Authorization', `Bearer ${session.newAccountToken}`);
      expect(res.status).toBe(400);
    });
    it('should return 403 if role !== ADMIN and current account !== params.id', async () => {
      expect.assertions(1);
      const res = await request(server)
        .put('/account/1')
        .set('Authorization', `Bearer ${session.newAccountToken}`)
        .send({
          first_name: 'blah'
        });
      expect(res.status).toBe(403);
    });
    it('should return 200 with valid token and current account === params.id', async () => {
      expect.assertions(1);
      const res = await request(server)
        .put(`/account/${session.newAccountID}`)
        .set('Authorization', `Bearer ${session.newAccountToken}`)
        .send({
          first_name: 'updated_name',
          password: 'updated_password',
          new_email: '123@gg.com',
          old_email: session.newAccount.email,
          new_phone: '987-654-3210',
          old_phone: session.newAccount.phone,
          phone_type: 'home'
        });
      expect(res.status).toBe(200);
    });
    it('session.newAccount should have been updated in db', async () => {
      expect.assertions(6);
      const data = await db
        .select('*')
        .from('account')
        .where({ id: session.newAccountID });
      expect(data[0].first_name).not.toBeNull();
      expect(data[0].first_name).not.toBe(session.newAccount.first_name);
      const data2 = await db
        .select('*')
        .from('email')
        .where({ account_id: session.newAccountID });
      expect(data2[0].email).not.toBeNull();
      expect(data2[0].email).not.toBe(session.newAccount.email);
      //reset email for next test
      session.newAccount.email = data2[0].email;
      const data3 = await db
        .select('*')
        .from('phone')
        .where({ account_id: session.newAccountID });
      expect(data3[0].phone).not.toBeNull();
      expect(data3[0].phone).not.toBe(session.newAccount.phone);
    });
    it('session.newAccount should have been updated in login table', async () => {
      expect.assertions(1);
      const data = await db
        .select(['created_at', 'updated_at'])
        .from('login')
        .where('account_id', session.newAccountID);
      expect(data[0].updated_at).not.toBe(data[0].created_at);
    });
  });

  // POST account/forgot
  describe('POST account/forgot', () => {
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
        .post('/account/forgot')
        .send({ email: 'a' });
      expect(res.status).toBe(400);
    });
    it('should return 200, but not update the login table if email not found', async () => {
      expect.assertions(2);
      const res = await request(server)
        .post('/account/forgot')
        .send({ email: 'nope@nope.com' });
      expect(res.status).toBe(200);
      const data = await db
        .select('reset_token_hash')
        .from('login')
        .where('account_id', session.newAccountID);
      expect(data[0].reset_token_hash).toBeNull();
    });
    it('should return 200, with updates to login table if all is well', async () => {
      expect.assertions(4);
      const res = await request(server)
        .post('/account/forgot')
        .send({ email: session.newAccount.email });
      expect(res.status).toBe(200);
      session.pwResetToken = message.mock.calls[0][1];
      const data = await db
        .select('*')
        .from('login')
        .where('account_id', session.newAccountID);
      expect(data[0].reset_token_hash).not.toBeNull();
      expect(data[0].reset_token_expiration).not.toBeNull();
      expect(data[0].reset_token_expiration.getTime()).toBeGreaterThan(
        data[0].updated_at.getTime()
      );
    });
  });

  // POST account/reset/:id/:token
  describe('POST account/reset/:id/:token', () => {
    it('should return 405 if not a POST', async () => {
      expect.assertions(1);
      const res = await request(server).put('/account/reset/:id/:token');
      expect(res.status).toBe(405);
    });
    it('should return 400 if password is missing of invalid', async () => {
      expect.assertions(1);
      const res = await request(server)
        .post(`/account/reset/9999/whatever`)
        .send({ password: 'a' });
      expect(res.status).toBe(400);
    });
    it('should return 401 if id is wrong', async () => {
      expect.assertions(1);
      const res = await request(server)
        .post(`/account/reset/9999/${session.pwResetToken}`)
        .send({ password: 'newpasswordoflength' });
      expect(res.status).toBe(401);
    });
    it('should return 401 if token is wrong', async () => {
      expect.assertions(1);
      const res = await request(server)
        .post(`/account/reset/1/wrong`)
        .send({ password: 'newpasswordoflength' });
      expect(res.status).toBe(401);
    });
    it('should return 200 if password reset', async () => {
      expect.assertions(1);
      const res = await request(server)
        .post(
          `/account/reset/${session.newAccountLoginID}/${session.pwResetToken}`
        )
        .send({ password: 'newpasswordoflength' });
      expect(res.status).toBe(200);
    });
    it('should clear token hash from login table after first call', async () => {
      expect.assertions(2);
      const data = await db
        .select('*')
        .from('login')
        .where('account_id', session.newAccountID);
      expect(data[0].reset_token_hash).toBe('');
      expect(data[0].reset_token_expiration).toEqual(data[0].updated_at);
    });
  });

  // GET account/list/?querystring
  describe('GET /account/list', () => {
    it('should return 405 if not a GET', async () => {
      expect.assertions(1);
      const res = await request(server).put('/account/list');
      expect(res.status).toBe(405);
    });
    it('should return 400 with an invalid token', async () => {
      expect.assertions(1);
      const res = await request(server)
        .get('/account/list')
        .set('Authorization', `Bearer gibberish`);
      expect(res.status).toBe(400);
    });
    it('should return 403 if is_admin = false', async () => {
      expect.assertions(1);
      const res = await request(server)
        .get('/account/list')
        .set('Authorization', `Bearer ${session.newAccountToken}`)
        .send({
          first_name: 'blah'
        });
      expect(res.status).toBe(403);
    });
    it('should return 400 with an invalid query string', async () => {
      expect.assertions(1);
      const res = await request(server)
        .get('/account/list/?orderby=gibberish')
        .set('Authorization', `Bearer ${session.initialToken}`);
      expect(res.status).toBe(400);
    });
    it('should return 200 with an valid query string', async () => {
      expect.assertions(2);
      const res = await request(server)
        .get('/account/list/?orderby=id&order=desc')
        .set('Authorization', `Bearer ${session.initialToken}`);
      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThanOrEqual(2);
      // 2 because original account + test created account
    });
  });

  // DELETE account/:id
  describe('DELETE /account/:id', () => {
    it('should return 401 with no token', async () => {
      expect.assertions(1);
      const res = await request(server).delete('/account/blah');
      expect(res.status).toBe(401);
    });
    it('should return 400 with an invalid token', async () => {
      expect.assertions(1);
      const res = await request(server)
        .delete('/account/blah')
        .set('Authorization', `Bearer gibberish`);
      expect(res.status).toBe(400);
    });
    it('should return 403 if role !== ADMIN and current account !== params.id', async () => {
      expect.assertions(1);
      const res = await request(server)
        .delete('/account/blah')
        .set('Authorization', `Bearer ${session.newAccountToken}`);
      expect(res.status).toBe(403);
    });
    it('should return 200 with valid token and current account === params.id', async () => {
      expect.assertions(1);
      const res = await request(server)
        .delete(`/account/${session.newAccountID}`)
        .set('Authorization', `Bearer ${session.newAccountToken}`);
      expect(res.status).toBe(200);
    });
    it('session.newAccount should have been deleted from account table', async () => {
      expect.assertions(1);
      const data = await db
        .select('*')
        .from('account')
        .where({ id: session.newAccountID });
      expect(data).toHaveLength(0);
    });
    it('session.newAccount should have been deleted (via cascade) from login table', async () => {
      expect.assertions(1);
      const data = await db
        .select('*')
        .from('login')
        .where({ account_id: session.newAccountID });
      expect(data).toHaveLength(0);
    });
  });
});
