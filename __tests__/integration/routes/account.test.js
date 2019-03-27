const request = require('supertest');
const db = require('../../../db/db');
const signToken = require('../../../controllers/account/signToken');
const { INITIAL_ACCOUNT } = require('../../../config');
let server;

describe('account', () => {
  const session = {
    initialToken: signToken(INITIAL_ACCOUNT.account_id, INITIAL_ACCOUNT.roll),
    // newAccount1 is registered by existing account and has login.
    newAccount1: {
      email: `stub@dfassdf.com`,
      password: 'abcdefghijklmnopqrstuvwxyz',
      role: 'CUSTOMER',
      first_name: 'John',
      last_name: 'Doe',
      company_name: 'Evil Corp',
      phone: '123-456-7890',
      phone_type: 'mobile'
    },
    newAccount1LoginID: null,
    newAccount1ID: null,
    newAccount1Token: null,
    pwResetToken1: null,
    verifyToken1: null,
    // newAccount2 is registered by existing account and DOES NOT have login.
    newAccount2: {
      email: `stub2@ggggg.com`,
      role: 'CUSTOMER',
      first_name: 'Tom',
      last_name: 'Thompson',
      company_name: 'Good Corp',
      phone: '555-555-5555',
      phone_type: 'home'
    },
    newAccount2Changes: {
      email: `stub2@ggggg.com`,
      first_name: 'Frank',
      last_name: 'Thompson',
      company_name: 'Good Corp',
      phone: '333-555-5555',
      phone_type: 'work'
    },
    newAccount2ID: null,
    verifyToken2: null,
    // newAccount3 is signed up and has login.
    newAccount3: {
      email: `stub3@fffff.com`,
      password: 'abcdefghijklmnopqrstuvwxyz',
      role: 'CUSTOMER',
      first_name: 'Pete',
      last_name: 'Peterson',
      company_name: 'Ok Corp',
      phone: '333-333-3333',
      phone_type: 'home'
    },
    newAccount3LoginID: null,
    newAccount3ID: null,
    newAccount3Token: null,
    verifyToken3: null
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
    jest.mock('../../../controllers/email/messages/verifyAccount');
    const message = require('../../../controllers/email/messages/verifyAccount');

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
          ...session.newAccount1,
          email: session.newAccount1.email.toUpperCase()
        });
      expect(res.status).toBe(200);
      session.newAccount1ID = res.body.id;
    });
    it('should return 200 even when no login data given', async () => {
      expect.assertions(1);
      const res = await request(server)
        .post('/account/register')
        .set('Authorization', `Bearer ${session.initialToken}`)
        .send({
          ...session.newAccount2
        });
      expect(res.status).toBe(200);
      session.newAccount2ID = res.body.id;
      session.verifyToken1 = message.mock.calls[0][1]; // First array position important since multiple calls made
    });
    it('session.newAccount1 should exist in account table, even if email case is different', async () => {
      expect.assertions(5);
      const data = await db
        .select('*')
        .from('account')
        .where({ id: session.newAccount1ID });
      expect(data[0].first_name).toBe(session.newAccount1.first_name);
      expect(data[0].last_name).toBe(session.newAccount1.last_name);
      expect(data[0].company_name).toBe(session.newAccount1.company_name);
      const data2 = await db
        .select('*')
        .from('login')
        .where({ account_id: session.newAccount1ID });
      expect(data2[0].email).toBe(session.newAccount1.email);
      const data3 = await db
        .select('*')
        .from('email')
        .where({ account_id: session.newAccount1ID });
      expect(data3[0].email).toBe(session.newAccount1.email);
    });
    it('session.newAccount1 should exist in login table, even if email case is different', async () => {
      expect.assertions(3);
      const data = await db
        .select('*')
        .from('login')
        .where({ account_id: session.newAccount1ID });
      session.newAccount1LoginID = data[0].id;
      expect(data[0]).toHaveProperty('id');
      expect(data[0]).toHaveProperty('hash');
      expect(data[0].email).toBe(session.newAccount1.email);
    });
  });

  // POST /account/signup
  describe('POST /account/signup', () => {
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
    jest.mock('../../../controllers/email/messages/verifyAccount');
    const message = require('../../../controllers/email/messages/verifyAccount');

    it('should return 405 if not a POST', async () => {
      expect.assertions(1);
      const res = await request(server).get('/account/signup');
      expect(res.status).toBe(405);
    });
    it('should return 400 if email or password invalid', async () => {
      expect.assertions(1);
      const res = await request(server)
        .post('/account/signup')
        .send({ email: 'a', password: 'a' });
      expect(res.status).toBe(400);
    });
    it('should return 200 with valid token and data, even if email is uppercase', async () => {
      expect.assertions(1);
      const res = await request(server)
        .post('/account/signup')
        .send({
          ...session.newAccount3,
          email: session.newAccount3.email.toUpperCase()
        });
      expect(res.status).toBe(200);
      session.newAccount3ID = res.body.id;
      session.verifyToken3 = message.mock.calls[1][1]; // First array position important since multiple calls made
    });
    it('should return 200 with valid token and data when claiming existing account', async () => {
      expect.assertions(1);
      const res = await request(server)
        .post('/account/signup')
        .send({
          ...session.newAccount2Changes,
          password: 'abcdefghijklmnop'
        });
      expect(res.status).toBe(200);
      session.verifyToken2 = message.mock.calls[2][1]; // First array position important since multiple calls made
    });
    it('session.newAccount3 should exist in account table, even if email case is different', async () => {
      expect.assertions(4);
      const data = await db
        .select('*')
        .from('account')
        .where({ id: session.newAccount3ID });
      expect(data[0].first_name).toBe(session.newAccount3.first_name);
      expect(data[0].last_name).toBe(session.newAccount3.last_name);
      expect(data[0].company_name).toBe(session.newAccount3.company_name);
      const data3 = await db
        .select('*')
        .from('email')
        .where({ account_id: session.newAccount3ID });
      expect(data3[0].email).toBe(session.newAccount3.email);
    });
  });

  // Pre-verify POST /account/login
  describe('Pre-verify POST /account/login', () => {
    it('should return 401 if account is unverified', async () => {
      expect.assertions(1);
      const res = await request(server)
        .post('/account/login')
        .send(session.newAccount1);
      expect(res.status).toBe(401);
    });
  });

  // POST /account/verify/:id/:token
  describe('POST /account/verify/:id/:token', () => {
    it('should return 405 if not POST', async () => {
      expect.assertions(1);
      const res = await request(server).get(
        `/account/verify/${session.newAccount3ID}/${session.verifyToken3}`
      );
      expect(res.status).toBe(405);
    });
    it('should return 401 with bad token', async () => {
      expect.assertions(1);
      const res = await request(server).post(
        `/account/verify/${session.newAccount3ID}/${session.verifyToken3}wrong`
      );
      expect(res.status).toBe(401);
    });
    it('should return 200 if id and token are valid for registered account', async () => {
      expect.assertions(1);
      const res = await request(server).post(
        `/account/verify/${session.newAccount1ID}/${session.verifyToken1}`
      );
      expect(res.status).toBe(200);
      session.newAccount1Token = res.get('x-auth-token');
      // console.error(res.headers['x-auth-token']);
    });
    it('should return 200 if id and token are valid for signup account', async () => {
      expect.assertions(1);
      const res = await request(server).post(
        `/account/verify/${session.newAccount3ID}/${session.verifyToken3}`
      );
      expect(res.status).toBe(200);
    });
    it('should return 200 if id and token are valid for claimed account', async () => {
      expect.assertions(1);
      const res = await request(server).post(
        `/account/verify/${session.newAccount2ID}/${session.verifyToken2}`
      );
      expect(res.status).toBe(200);
    });
    it('session.newAccount2 should have been updated', async () => {
      expect.assertions(2);
      const data = await db
        .select('*')
        .from('account')
        .where({ id: session.newAccount2ID });
      expect(data[0].first_name).toBe(session.newAccount2Changes.first_name);
      const data3 = await db
        .select('*')
        .from('phone')
        .where({ account_id: session.newAccount2ID, is_primary: true });
      expect(data3[0].phone).toBe(session.newAccount2Changes.phone);
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
        .send({ ...session.newAccount1, password: 'VERYWRONG!!!' });
      expect(res.status).toBe(401);
    });
    it('should return 200 if good credentials', async () => {
      expect.assertions(1);
      const res = await request(server)
        .post('/account/login')
        .send(session.newAccount1);
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
        .set('Authorization', `Bearer ${session.newAccount1Token}`);
      expect(res.status).toBe(400);
    });
    it('should return 403 if role !== ADMIN and current account !== params.id', async () => {
      expect.assertions(1);
      const res = await request(server)
        .put('/account/1')
        .set('Authorization', `Bearer ${session.newAccount1Token}`)
        .send({
          first_name: 'blah'
        });
      expect(res.status).toBe(403);
    });
    it('should return 200 with valid token and current account === params.id', async () => {
      expect.assertions(1);
      const res = await request(server)
        .put(`/account/${session.newAccount1ID}`)
        .set('Authorization', `Bearer ${session.newAccount1Token}`)
        .send({
          first_name: 'updated_name',
          password: 'updated_password',
          new_email: '123@gg.com',
          current_email: session.newAccount1.email,
          new_phone: '987-654-3210',
          current_phone: session.newAccount1.phone,
          phone_type: 'home'
        });
      expect(res.status).toBe(200);
    });
    it('session.newAccount1 should have been updated in db', async () => {
      expect.assertions(6);
      const data = await db
        .select('*')
        .from('account')
        .where({ id: session.newAccount1ID });
      expect(data[0].first_name).not.toBeNull();
      expect(data[0].first_name).not.toBe(session.newAccount1.first_name);
      const data2 = await db
        .select('*')
        .from('email')
        .where({ account_id: session.newAccount1ID });
      expect(data2[0].email).not.toBeNull();
      expect(data2[0].email).not.toBe(session.newAccount1.email);
      //reset email for next test
      session.newAccount1.email = data2[0].email;
      const data3 = await db
        .select('*')
        .from('phone')
        .where({ account_id: session.newAccount1ID });
      expect(data3[0].phone).not.toBeNull();
      expect(data3[0].phone).not.toBe(session.newAccount1.phone);
    });
    it('session.newAccount1 should have been updated in login table', async () => {
      expect.assertions(1);
      const data = await db
        .select(['created_at', 'updated_at'])
        .from('login')
        .where('account_id', session.newAccount1ID);
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
        .where('account_id', session.newAccount1ID);
      expect(data[0].reset_token_hash).toBeNull();
    });
    it('should return 200, with updates to login table if all is well', async () => {
      expect.assertions(4);
      const res = await request(server)
        .post('/account/forgot')
        .send({ email: session.newAccount1.email });
      expect(res.status).toBe(200);
      session.pwResetToken1 = message.mock.calls[0][1];
      const data = await db
        .select('*')
        .from('login')
        .where('account_id', session.newAccount1ID);
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
        .post(`/account/reset/9999/${session.pwResetToken1}`)
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
          `/account/reset/${session.newAccount1LoginID}/${
            session.pwResetToken1
          }`
        )
        .send({ password: 'newpasswordoflength' });
      expect(res.status).toBe(200);
    });
    it('should clear token hash from login table after first call', async () => {
      expect.assertions(2);
      const data = await db
        .select('*')
        .from('login')
        .where('account_id', session.newAccount1ID);
      expect(data[0].reset_token_hash).toBe('');
      expect(data[0].reset_token_expiration).toEqual(data[0].updated_at);
    });
  });

  // GET account/search/?querystring
  describe('GET /account/search', () => {
    it('should return 405 if not a GET', async () => {
      expect.assertions(1);
      const res = await request(server).put('/account/search');
      expect(res.status).toBe(405);
    });
    it('should return 400 with an invalid token', async () => {
      expect.assertions(1);
      const res = await request(server)
        .get('/account/search')
        .set('Authorization', `Bearer gibberish`);
      expect(res.status).toBe(400);
    });
    it('should return 403 if not ADMIN or EMPLOYEE', async () => {
      expect.assertions(1);
      const res = await request(server)
        .get('/account/search')
        .set('Authorization', `Bearer ${session.newAccount1Token}`)
        .send({
          first_name: 'blah'
        });
      expect(res.status).toBe(403);
    });
    it('should return 400 with an invalid query string', async () => {
      expect.assertions(1);
      const res = await request(server)
        .get('/account/search/?orderby=gibberish')
        .set('Authorization', `Bearer ${session.initialToken}`);
      expect(res.status).toBe(400);
    });
    it('should return 200 with an valid query string', async () => {
      expect.assertions(2);
      const res = await request(server)
        .get('/account/search/?orderby=id&order=desc&field=email&query=com')
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
        .set('Authorization', `Bearer ${session.newAccount1Token}`);
      expect(res.status).toBe(403);
    });
    it('should return 200 with valid token and current account === params.id', async () => {
      expect.assertions(3);
      const res1 = await request(server)
        .delete(`/account/${session.newAccount1ID}`)
        .set('Authorization', `Bearer ${session.initialToken}`);
      expect(res1.status).toBe(200);
      const res2 = await request(server)
        .delete(`/account/${session.newAccount2ID}`)
        .set('Authorization', `Bearer ${session.initialToken}`);
      expect(res2.status).toBe(200);
      const res3 = await request(server)
        .delete(`/account/${session.newAccount3ID}`)
        .set('Authorization', `Bearer ${session.initialToken}`);
      expect(res3.status).toBe(200);
    });
    it('session.newAccount1 & session.newAccount2 should have been deleted from account table', async () => {
      expect.assertions(1);
      const data = await db
        .select('*')
        .from('account')
        .where({ id: session.newAccount1ID });
      expect(data).toHaveLength(0);
    });
    it('session.newAccount1 should have been deleted (via cascade) from login table', async () => {
      expect.assertions(1);
      const data = await db
        .select('*')
        .from('login')
        .where({ account_id: session.newAccount1ID });
      expect(data).toHaveLength(0);
    });
  });

  // GET account/history/:id
  describe('GET /account/history/:id', () => {
    it('should return 401 with no token', async () => {
      expect.assertions(1);
      const res = await request(server).get('/account/history/blah');
      expect(res.status).toBe(401);
    });
    it('should return 400 with an invalid token', async () => {
      expect.assertions(1);
      const res = await request(server)
        .get('/account/history/1')
        .set('Authorization', `Bearer gibberish`);
      expect(res.status).toBe(400);
    });
    it('should return 403 if role !== ADMIN or !== EMPLOYEE', async () => {
      expect.assertions(1);
      const res = await request(server)
        .get('/account/history/1')
        .set('Authorization', `Bearer ${session.newAccount1Token}`);
      expect(res.status).toBe(403);
    });
    it('should return 200 with valid token and current account === params.id, and query string working', async () => {
      expect.assertions(3);
      const res = await request(server)
        .get(`/account/history/${session.newAccount1ID}?order=desc`)
        .set('Authorization', `Bearer ${session.initialToken}`);
      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThan(2);
      expect(parseInt(res.body[0].id)).toBeGreaterThan(
        parseInt(res.body[2].id)
      );
    });
  });
});
