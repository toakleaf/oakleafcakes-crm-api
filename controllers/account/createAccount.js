module.exports = (req, res, db) => {
  let {
    email,
    role,
    first_name,
    last_name,
    company_name,
    phone,
    phone_type,
    phone_country
  } = req.body;
  let phone_raw = phone ? phone.replace(/[^0-9]/g, '') : null;
  let output = {};

  db.transaction(trx => {
    trx('account')
      .returning('*')
      .insert({ first_name, last_name, company_name })
      .then(accountData => {
        output = { ...accountData[0] };

        if (email) {
          email = email.toLowerCase();
          return trx('email')
            .returning('*')
            .insert({
              email,
              is_primary: true,
              account_id: accountData[0].id
            });
        }
        return;
      })
      .then(emailData => {
        if (emailData) output = { ...output, emails: emailData };
        if (phone) {
          return trx('phone')
            .returning('*')
            .insert({
              phone,
              phone_raw,
              phone_type,
              phone_country,
              is_primary: true,
              account_id: output.id
            });
        }
        return;
      })
      .then(phoneData => {
        if (phoneData) output = { ...output, phones: phoneData };
        if (!role) role = 'CUSTOMER';
        return trx('account_role')
          .returning('*')
          .insert({
            account_id: output.id,
            role
          });
      })
      .then(roleData => {
        console.log(roleData);
        if (roleData) output = { ...output, role: roleData[0].role };
        return trx('account_history').insert({
          account_id: output.id,
          author: req.account ? req.account.account_id : accountData[0].id,
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
        return res.json({
          ...output,
          is_active: false,
          logins: []
        });
      })
      .then(trx.commit)
      .catch(trx.rollback);
  }).catch(err => {
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
};
