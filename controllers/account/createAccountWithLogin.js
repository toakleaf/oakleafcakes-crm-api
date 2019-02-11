module.exports = async (req, res, db, bcrypt, signToken, config, sendMail) => {
  let {
    email,
    password,
    role,
    first_name,
    last_name,
    company_name,
    phone,
    phone_type
  } = req.body;

  try {
    const hash = await bcrypt.hash(password, config.BCRYPT_COST_FACTOR);
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
                if (!role) throw new Error('Account role must be specified.');
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
                        hash,
                        role,
                        phone,
                        phone_type
                      }
                    });
                  });
              })
              .then(() => {
                const token = signToken(accountData[0].id, role);
                return res.header('x-auth-token', token).json({
                  ...accountData[0],
                  email,
                  phone,
                  phone_type,
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
