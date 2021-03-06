const createAccount = require('./createAccount');
const createAccountWithLogin = require('./createAccountWithLogin');
const claimAccount = require('./claimAccount');

module.exports = async (
  req,
  res,
  db,
  crypto,
  bcrypt,
  config,
  sendMail,
  snapshot
) => {
  // if login exists throw error so user can later retrieve account pw.
  // if email or phone exists then allow user to claim account by creating
  // a new login.
  try {
    const login = await db('login')
      .select('account_id')
      .where('email', req.body.email)
      .then(id => id[0]);
    if (login) {
      return res
        .status(503)
        .send(
          'Failed to create new account. An account having a login with this email or phone number already exists.'
        );
    }
    const idEmail = await db('email')
      .select('account_id')
      .where('email', req.body.email)
      .then(id => {
        if (id[0]) {
          return id[0].account_id;
        }
        return;
      });
    let idPhone = null;
    if (req.body.phone) {
      idPhone = await db('phone')
        .select('account_id')
        .where('phone_raw', req.body.phone.replace(/[^0-9]/g, ''))
        .then(id => {
          if (id[0]) return id[0].account_id;
          return;
        });
    }
    let id = idEmail;
    if (!id && idPhone) id = idPhone;
    if (id) {
      const role = await db('account_role')
        .select('role')
        .where('account_id', id)
        .then(role => role[0].role);
      if (role === 'ADMIN' || role === 'EMPLOYEE') {
        return res
          .status(503)
          .send(
            'Account with this email/phone already exists and cannot be overwritten'
          );
      }
      claimAccount(
        req,
        res,
        db,
        crypto,
        bcrypt,
        config,
        sendMail,
        id,
        snapshot
      );
    } else {
      createAccountWithLogin(
        req,
        res,
        db,
        crypto,
        bcrypt,
        config,
        sendMail,
        snapshot
      );
    }
  } catch (err) {
    console.error(err);
    res.status(503).send('Failed to create account.');
  }
};
