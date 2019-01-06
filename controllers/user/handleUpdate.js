module.exports = async (req, res, db, bcrypt) => {
  if (req.params.id !== req.user.user_id && !req.user.is_admin) {
    //Current user can update their own user account. Admins can update anyone.
    return res.status(403).send('Not authorized to update this account.');
  }
  const {
    email,
    password,
    is_admin,
    first_name,
    last_name,
    display_name
  } = req.body;
  if (!req.user.is_admin && is_admin) {
    return res.status(403).send('Only admins can create admin accounts');
  }
  if (
    !email &&
    !password &&
    !is_admin &&
    !first_name &&
    !last_name &&
    !display_name
  ) {
    return res.status(400).send('No update request information given.');
  }
  const now = db.fn.now();
  const userUpdates = {
    ...(email ? { email } : {}),
    ...(first_name ? { first_name } : {}),
    ...(last_name ? { last_name } : {}),
    ...(display_name ? { display_name } : {}),
    updated_at: now
  };
  const loginUpdates = {
    ...(email ? { email } : {}),
    ...(is_admin ? { is_admin } : {}),
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
            .where('id', req.params.id)
            .returning('is_admin')
            .update({ ...loginUpdates, hash: hash })
            .then(loginData => {
              res.json({ ...userData[0], is_admin: loginData[0] });
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
      const hash = await bcrypt.hash(password, 10);
      runUpdates(hash);
    } catch (err) {
      return res.status(503).send('Failed to update user. ' + err);
    }
  } else runUpdates();
};
