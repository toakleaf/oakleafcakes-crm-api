const createAccount = require('./createAccount');
const createAccountWithLogin = require('./createAccountWithLogin');
const claimAccount = require('./claimAccount');

module.exports = async (req, res, db, bcrypt, signToken, config, sendMail) => {
  // if login exists throw error so user can later retrieve account pw.
  // if email or phone exists then allow user to claim account by creating
  // a new login.
  try {
    const login = await db('login')
      .select('account_id')
      .where('email', 'req.body.email')
      .then(id => id[0]);
    if (login) {
      return res
        .status(503)
        .send(
          'Failed to create new account. account account with this email or phone number already exists.'
        );
    }
    const id = await db('email')
      .select('account_id')
      .where('email', 'req.body.email')
      .then(id => id[0])
      .then(idEmail => {
        return db('phone')
          .select('account_id')
          .where('phone', 'req.body.phone')
          .then(idPhone => idPhone[0])
          .then(idPhone => {
            console.log(idEmail);
            console.log(idPhone);
            if (!idEmail && !idPhone) return null;
            if (idEmail === idPhone) return idEmail;
            if (idEmail) return idEmail;
            return idPhone;
          });
      });

    if (id) {
      const role = await db('account')
        .select('role')
        .where('id', id)
        .then(role => role[0]);
      if (role === 'ADMIN' || role === 'EMPLOYEE') {
        return res
          .status(503)
          .send(
            'Account with this email/phone already exists and cannot be overwritten'
          );
      }
      claimAccount(req, res, db, bcrypt, signToken, config, sendMail, id);
    } else {
      createAccountWithLogin(req, res, db, bcrypt, signToken, config, sendMail);
    }
  } catch (err) {
    console.error(err);
    res.status(503).send('Failed to create account.');
  }
};
