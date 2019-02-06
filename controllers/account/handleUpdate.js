module.exports = async (req, res, db, bcrypt, config) => {
  const {
    new_email,
    old_email,
    password,
    role,
    first_name,
    last_name,
    company_name,
    new_phone,
    old_phone,
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
    updated_at: now
  };
  const phoneUpdates = {
    ...(new_phone ? { phone: new_phone } : {}),
    ...(phone_type ? { phone_type } : {}),
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
          return trx('login')
            .where('account_id', req.params.id)
            .update(loginUpdates)
            .then(() => {
              if (password) {
                return trx('login')
                  .where('account_id', req.params.id)
                  .update({ hash, updated_at: now });
              }
              return;
            })
            .then(() => {
              return trx('account_role')
                .where('account_id', req.params.id)
                .update({ role, updated_at: now });
            })
            .then(() => {
              if (new_email && old_email) {
                return trx('email')
                  .where({ account_id: req.params.id, email: old_email })
                  .update(emailUpdates);
              }
              return;
            })
            .then(() => {
              if (new_phone && old_phone) {
                return trx('phone')
                  .where({ account_id: req.params.id, phone: old_phone })
                  .update(phoneUpdates);
              }
              return;
            })
            .then(() => {
              res.send(`account #${req.params.id} updated successfully.`);
            });
        })
        .then(trx.commit)
        .catch(trx.rollback);
    }).catch(err => {
      res.status(503).send('Failed to update account. ' + err);
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
