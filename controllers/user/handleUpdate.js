module.exports = async (req, res, db, bcrypt, config) => {
  const {
    email,
    password,
    role,
    first_name,
    last_name,
    company_name,
    phone,
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
    ...(email ? { email } : {}),
    updated_at: now
  };
  const phoneUpdates = {
    ...(phone ? { phone } : {}),
    ...(phone_type ? { phone_type } : {}),
    updated_at: now
  };
  const loginUpdates = {
    ...(email ? { email } : {}),
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
              if (email) {
                return trx('email')
                  .where({ user_id: req.params.id, email })
                  .update(emailUpdates);
              }
              return;
            })
            .then(() => {
              if (phone) {
                return trx('phone')
                  .where({ user_id: req.params.id, phone })
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
