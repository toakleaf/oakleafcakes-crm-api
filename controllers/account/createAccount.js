module.exports = (req, res, db) => {
  let {
    email,
    role,
    first_name,
    last_name,
    company_name,
    phone,
    phone_type
  } = req.body;

  db.transaction(trx => {
    trx('account')
      .returning('*')
      .insert({ first_name, last_name, company_name })
      .then(async accountData => {
        if (email) {
          email = email.toLowerCase();
          await trx('email').insert({
            email,
            is_primary: true,
            account_id: accountData[0].id
          });
        }
        if (phone) {
          phone_type = phone_type ? phone_type.toLowerCase() : null;
          await trx('phone').insert({
            phone,
            phone_type,
            is_primary: true,
            account_id: accountData[0].id
          });
        }
        await trx('account_history').insert({
          account_id: accountData[0].id,
          author: req.account ? req.account.account_id : accountData[0].id,
          action: 'CREATE',
          transaction: {
            first_name,
            last_name,
            company_name,
            email,
            role,
            phone,
            phone_type
          }
        });
        return trx('account_role')
          .insert({
            account_id: accountData[0].id,
            role
          })
          .then(() => {
            res.json({
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
  }).catch(err => {
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
};
