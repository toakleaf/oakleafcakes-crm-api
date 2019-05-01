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
    phone_type,
    phone_country,
    is_active
  } = req.body;
  let new_phone_raw = new_phone ? new_phone.replace(/[^0-9]/g, '') : null;
  let current_phone_raw = current_phone
    ? current_phone.replace(/[^0-9]/g, '')
    : null;

  const now = new Date(Date.now());

  const accountUpdates = {
    ...(first_name ? { first_name } : {}),
    ...(last_name ? { last_name } : {}),
    ...(company_name ? { company_name } : {}),
    updated_at: now
  };
  const emailUpdates = {
    ...(new_email ? { email: new_email } : {}),
    ...(email_is_primary || email_is_primary === false
      ? { is_primary: email_is_primary }
      : {}),
    updated_at: now
  };
  const phoneUpdates = {
    ...(new_phone ? { phone: new_phone } : {}),
    ...(new_phone_raw ? { phone: new_phone_raw } : {}),
    ...(phone_type ? { phone_type } : {}),
    ...(phone_country ? { phone_country } : {}),
    ...(phone_is_primary || phone_is_primary === false
      ? { is_primary: phone_is_primary }
      : {}),
    updated_at: now
  };
  const loginUpdates = {
    ...(new_email ? { email: new_email } : {}),
    ...(is_active || is_active === false ? { is_active } : {}),
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
              if (current_email) {
                //only update login if the current_email is the login email
                return trx('login')
                  .where('email', current_email)
                  .update(loginUpdates)
                  .returning('is_active')
                  .then(active => {});
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
                  .select('phone_raw')
                  .where({ account_id: req.params.id, is_primary: true })
                  .then(primary_phone_raw => primary_phone_raw[0]);
              }
              return;
            })
            .then(primary_phone_raw => {
              if (!primary_phone_raw && new_phone) {
                // just add new_phone if there is no primary phone, but new_phone was submitted
                return trx('phone')
                  .insert({
                    account_id: req.params.id,
                    phone: new_phone,
                    phone_raw: new_phone_raw,
                    is_primary: true,
                    ...(phone_type ? { phone_type } : {}),
                    ...(phone_country ? { phone_country } : {})
                  })
                  .then(() => {
                    return;
                  });
              }
              if (
                primary_phone_raw &&
                current_phone_raw &&
                primary_phone_raw !== current_phone_raw &&
                phone_is_primary
              ) {
                // make previous primary phone not primary so current phone can become primary
                return trx('phone')
                  .where({
                    account_id: req.params.id,
                    phone_raw: primary_phone_raw
                  })
                  .update({ is_primary: false });
              }
              return;
            })
            .then(() => {
              if (current_phone) {
                return trx('phone')
                  .where({
                    account_id: req.params.id,
                    phone_raw: current_phone_raw
                  })
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
                  ...(email_is_primary || email_is_primary === false
                    ? { email_is_primary }
                    : {}),
                  ...(current_phone ? { current_phone } : {}),
                  ...(new_phone ? { new_phone } : {}),
                  ...(current_phone_raw ? { current_phone_raw } : {}),
                  ...(new_phone_raw ? { new_phone_raw } : {}),
                  ...(phone_is_primary || phone_is_primary === false
                    ? { phone_is_primary }
                    : {}),
                  ...(phone_type ? { phone_type } : {}),
                  ...(phone_country ? { phone_country } : {}),
                  ...(is_active || is_active === false ? { is_active } : {})
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
      } else {
        console.error(err);
        res.status(503).send('Failed to update account. ' + err);
      }
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
