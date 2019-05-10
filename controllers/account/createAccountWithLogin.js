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
  let phone_raw = phone ? phone.replace(/[^0-9]/g, '') : null;

  try {
    const hash = await bcrypt.hash(password, config.BCRYPT_COST_FACTOR);
    const token = crypto
      .randomBytes(24)
      .toString('base64')
      .replace(/\W/g, '');
    const activation_hash = await bcrypt.hash(token, config.BCRYPT_COST_FACTOR);
    let output = {};

    await db
      .transaction(trx => {
        trx('account')
          .returning('*')
          .insert({ first_name, last_name, company_name })
          .then(accountData => {
            output = { ...accountData[0] };
            if (!email) throw new Error('Email is required.');
            email = email.toLowerCase();
            return trx('login')
              .returning('*')
              .insert({
                account_id: accountData[0].id,
                email,
                hash
              });
          })
          .then(loginData => {
            output = {
              ...output,
              logins: [{ id: loginData[0].id, email, is_active: false }]
            };
            if (!role) role = 'CUSTOMER';
            role = role.toUpperCase();
            return trx('account_role')
              .returning('*')
              .insert({
                account_id: loginData[0].account_id,
                role
              })
              .then(roleData => {
                output = { ...output, role: roleData[0].role };
                return trx('email')
                  .returning('*')
                  .insert({
                    email,
                    is_primary: true,
                    account_id: loginData[0].account_id
                  });
              })
              .then(emailData => {
                output = {
                  ...output,
                  emails: emailData
                };
                if (phone) {
                  return trx('phone')
                    .returning('*')
                    .insert({
                      phone,
                      phone_type,
                      phone_raw,
                      phone_country,
                      is_primary: true,
                      account_id: loginData[0].account_id
                    });
                }
                return;
              });
          })
          .then(phoneData => {
            if (phoneData) output = { ...output, phones: phoneData };
            return trx('account_history').insert({
              account_id: output.id,
              author: req.account ? req.account.account_id : output.id,
              action: 'CREATE',
              transaction: {
                first_name,
                last_name,
                company_name,
                email,
                role,
                phone,
                phone_raw,
                phone_type,
                phone_country
              }
            });
          })
          .then(() => {
            return trx('activation_hash').insert({
              hash: activation_hash,
              account_id: output.id
            });
          })
          .then(() => {
            const verifyMessage = message(
              output.id,
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
              ...output,
              is_active: false
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
