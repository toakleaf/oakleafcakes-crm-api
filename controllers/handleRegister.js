//Only admins can register new users.

const handleRegister = (req, res, db, bcrypt) => {
  const {
    email,
    password,
    is_admin,
    first_name,
    last_name,
    display_name
  } = req.body;
  db('user')
    .returning('id')
    .insert({
      email: email,
      first_name: first_name,
      last_name: last_name,
      display_name: display_name
    })
    .then(id => {
      bcrypt.hash(password, 10).then(hash => {
        db('login')
          .returning(['user_id', 'email', 'is_admin'])
          .insert({
            user_id: parseInt(id),
            email: email,
            hash: hash,
            is_admin: is_admin
          })
          .then(data =>
            res.header('x-created-user-id', data[0].user_id).json(data[0])
          );
      });
    })
    .catch(err => {
      if (err.message.includes('duplicate key'))
        res
          .status(503)
          .send(
            'Failed to create new user. User account with this email already exists.'
          );
      else res.status(503).send('Failed to create user.' + err);
    });
};

module.exports = handleRegister;
