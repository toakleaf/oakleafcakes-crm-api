const message = require('../email/messages/verifyAccount');

module.exports = async (req, res, db, crypto, bcrypt, config, sendMail) => {
  let {
    email,
    password,
    role,
    first_name,
    last_name,
    company_name,
    phone,
    phone_type,
    phone_country
  } = req.body;

  try {
    const hash = await bcrypt.hash(password, config.BCRYPT_COST_FACTOR);
    const token = crypto
      .randomBytes(24)
      .toString('base64')
      .replace(/\W/g, '');
    const activation_hash = await bcrypt.hash(token, config.BCRYPT_COST_FACTOR);
    await db
      .transaction(trx => {
        trx('account')
          .returning('*')
          .insert({ first_name, last_name, company_name })
          .then(accountData => {
            if (!email) throw new Error('Email is required.');
            email = email.toLowerCase();
            return trx('login')
              .returning('*')
              .insert({
                account_id: accountData[0].id,
                email,
                hash
              })
              .then(loginData => {
                if (!role) role = 'CUSTOMER';
                role = role.toUpperCase();
                return trx('account_role')
                  .insert({
                    account_id: loginData[0].account_id,
                    role
                  })
                  .then(() => {
                    return trx('email').insert({
                      email,
                      is_primary: true,
                      account_id: loginData[0].account_id
                    });
                  })
                  .then(() => {
                    if (phone) {
                      phone_type = phone_type ? phone_type.toLowerCase() : null;
                      return trx('phone').insert({
                        phone,
                        phone_type,
                        phone_country,
                        is_primary: true,
                        account_id: loginData[0].account_id
                      });
                    }
                    return;
                  })
                  .then(() => {
                    return trx('account_history').insert({
                      account_id: accountData[0].id,
                      author: req.account
                        ? req.account.account_id
                        : accountData[0].id,
                      action: 'CREATE',
                      transaction: {
                        first_name,
                        last_name,
                        company_name,
                        email,
                        role,
                        phone,
                        phone_type,
                        phone_country
                      }
                    });
                  });
              })
              .then(() => {
                return trx('activation_hash').insert({
                  hash: activation_hash,
                  account_id: accountData[0].id
                });
              })
              .then(() => {
                const verifyMessage = message(
                  accountData[0].id,
                  token,
                  first_name || 'there'
                );
                return sendMail({
                  ...verifyMessage,
                  to: email,
                  from: `${config.COMPANY_NAME} Account Verification <noreply@${
                    config.COMPANY_SITE
                  }>`
                });
              })
              .then(() => {
                return res.json({
                  ...accountData[0],
                  email,
                  phone,
                  phone_type,
                  phone_country,
                  role
                });
              });
          })
          .then(trx.commit)
          .catch(trx.rollback);
      })
      .catch(err => {
        console.error(err);
        if (err.message.includes('duplicate key'))
          res
            .status(503)
            .send(
              'Failed to create new account. account account with this email or phone number already exists.'
            );
        else if (err.message.includes('foreign key'))
          res
            .status(503)
            .send('Failed to create new account. Invalid account role.');
        else res.status(503).send('Failed to create account. ' + err);
      });
  } catch (err) {
    res.status(503).send('Failed to create account.');
  }
};
