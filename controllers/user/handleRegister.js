//Only admins can register new users.

const handleRegister = async (req, res, db, bcrypt) => {
  const {
    email,
    password,
    is_admin,
    first_name,
    last_name,
    display_name
  } = req.body;

  try {
    const hash = await bcrypt.hash(password, 10);
    db.transaction(trx => {
      trx('user')
        .returning('*')
        .insert({ email, first_name, last_name, display_name })
        .then(userData => {
          return trx('login')
            .insert({
              user_id: userData[0].id,
              email,
              hash,
              is_admin
            })
            .then(() => {
              res.json(userData[0]);
            });
        })
        .then(trx.commit)
        .catch(trx.rollback);
    }).catch(err => {
      if (err.message.includes('duplicate key'))
        res
          .status(503)
          .send(
            'Failed to create new user. User account with this email already exists.'
          );
      else res.status(503).send('Failed to create user. ' + err);
    });
  } catch (err) {
    res.status(503).send('Failed to create user.');
  }
};

module.exports = handleRegister;
