module.exports = async (req, res, db, bcrypt, config) => {
  const {
    new_email,
    current_email,
    email_is_primary,
    password,
    role,
    first_name,
    last_name,
    company_name,
    new_phone,
    current_phone,
    phone_is_primary,
    phone_type
  } = req.body;

  const now = new Date(Date.now());

  const accountUpdates = {
    ...(first_name ? { first_name } : {}),
    ...(last_name ? { last_name } : {}),
    ...(company_name ? { company_name } : {}),
    updated_at: now
  };
  const emailUpdates = {
    ...(new_email ? { email: new_email } : {}),
    ...(email_is_primary ? { email: email_is_primary } : {}),
    updated_at: now
  };
  const phoneUpdates = {
    ...(new_phone ? { phone: new_phone } : {}),
    ...(phone_type ? { phone_type } : {}),
    ...(phone_is_primary ? { phone_is_primary } : {}),
    updated_at: now
  };
  const loginUpdates = {
    ...(new_email ? { email: new_email } : {}),
    updated_at: now
  };

  const runUpdates = hash => {
    db.transaction(trx => {
      trx('account')
        .where('id', req.params.id)
        .returning('*')
        .update(accountUpdates)
        .then(accountData => {
          if (accountData.length == 0) throw new Error('Invalid id');
          return trx('account_role')
            .where('account_id', req.params.id)
            .update({ role, updated_at: now })
            .then(() => {
              if (current_email) {
                return db('email')
                  .select('email')
                  .where({ account_id: req.params.id, is_primary: true })
                  .then(primary_email => primary_email[0]);
              }
              return;
            })
            .then(primary_email => {
              if (
                current_email &&
                primary_email !== current_email &&
                email_is_primary
              ) {
                // make previous primary email not primary so current email can become primary
                return trx('email')
                  .where({ account_id: req.params.id, email: primary_email })
                  .update({ is_primary: false });
              }
              return;
            })
            .then(() => {
              if (current_email) {
                return trx('email')
                  .where({ account_id: req.params.id, email: current_email })
                  .update(emailUpdates)
                  .then(success => {
                    if (!success) {
                      throw new Error('current_email not found');
                    }
                    return;
                  });
              }
              return;
            })
            .then(() => {
              if (new_email && current_email) {
                //only update login if the current_email is the login email
                return trx('login')
                  .where('email', current_email)
                  .update(loginUpdates);
              }
              return;
            })
            .then(() => {
              if (password) {
                return trx('login')
                  .where('account_id', req.params.id)
                  .update({ hash, updated_at: now });
              }
              return;
            })
            .then(() => {
              if (current_phone) {
                return db('phone')
                  .select('phone')
                  .where({ account_id: req.params.id, is_primary: true })
                  .then(primary_phone => primary_phone[0]);
              }
              return;
            })
            .then(primary_phone => {
              if (
                current_phone &&
                primary_phone !== current_phone &&
                phone_is_primary
              ) {
                // make previous primary phone not primary so current phone can become primary
                return trx('phone')
                  .where({ account_id: req.params.id, phone: primary_phone })
                  .update({ is_primary: false });
              }
              return;
            })
            .then(() => {
              if (current_phone) {
                return trx('phone')
                  .where({ account_id: req.params.id, phone: current_phone })
                  .update(phoneUpdates)
                  .then(success => {
                    if (!success) {
                      throw new Error('current_phone not found');
                    }
                    return;
                  });
              }
              return;
            })
            .then(() => {
              return trx('account_history').insert({
                account_id: req.params.id,
                author: req.account.account_id,
                action: 'UPDATE',
                transaction: {
                  ...accountUpdates,
                  ...(current_email ? { current_email } : {}),
                  ...(new_email ? { new_email } : {}),
                  ...(email_is_primary ? { email_is_primary } : {}),
                  ...(current_phone ? { current_phone } : {}),
                  ...(new_phone ? { new_phone } : {}),
                  ...(phone_is_primary ? { phone_is_primary } : {}),
                  ...(phone_type ? { phone_type } : {})
                }
              });
            })
            .then(() => {
              return res.send(
                `account #${req.params.id} updated successfully.`
              );
            });
        })
        .then(trx.commit)
        .catch(trx.rollback);
    }).catch(err => {
      if (err.message.includes('duplicate key')) {
        res
          .status(503)
          .send(
            'Failed to update account. Account with this email address already exists.'
          );
      } else res.status(503).send('Failed to update account. ' + err);
    });
  };

  if (password) {
    try {
      const hash = await bcrypt.hash(password, config.BCRYPT_COST_FACTOR);
      runUpdates(hash);
    } catch (err) {
      return res.status(503).send('Failed to update account. ' + err);
    }
  } else runUpdates();
};
