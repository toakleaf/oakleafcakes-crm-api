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

  const userUpdates = {
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
    ...(role ? { role } : {}),
    updated_at: now
  };

  const runUpdates = hash => {
    db.transaction(trx => {
      trx('user')
        .where('id', req.params.id)
        .returning('*')
        .update(userUpdates)
        .then(userData => {
          if (userData.length == 0) throw new Error('Invalid id');
          return trx('login')
            .where('user_id', req.params.id)
            .update(loginUpdates)
            .then(() => {
              if (password) {
                return trx('login')
                  .where('user_id', req.params.id)
                  .update({ hash });
              }
              return;
            })
            .then(() => {
              if (new_email && old_email) {
                console.log('hi');
                return trx('email')
                  .where({ user_id: req.params.id, email: old_email })
                  .update(emailUpdates);
              }
              return;
            })
            .then(() => {
              if (new_phone && old_phone) {
                return trx('phone')
                  .where({ user_id: req.params.id, phone: old_phone })
                  .update(phoneUpdates);
              }
              return;
            })
            .then(() => {
              res.send(`User #${req.params.id} updated successfully.`);
            });
        })
        .then(trx.commit)
        .catch(trx.rollback);
    }).catch(err => {
      res.status(503).send('Failed to update user. ' + err);
    });
  };

  if (password) {
    try {
      const hash = await bcrypt.hash(password, config.BCRYPT_COST_FACTOR);
      runUpdates(hash);
    } catch (err) {
      return res.status(503).send('Failed to update user. ' + err);
    }
  } else runUpdates();
};
