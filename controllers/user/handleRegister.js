module.exports = async (req, res, db, bcrypt, signToken, config) => {
  let {
    email,
    password,
    role,
    first_name,
    last_name,
    company_name,
    phone,
    phone_type
  } = req.body;

  try {
    const hash = await bcrypt.hash(password, config.BCRYPT_COST_FACTOR);
    db.transaction(trx => {
      trx('user')
        .returning('*')
        .insert({ first_name, last_name, company_name })
        .then(userData => {
          if (!email) throw new Error('Email is required.');
          email = email.toLowerCase();
          return trx('login')
            .returning('*')
            .insert({
              user_id: userData[0].id,
              email,
              hash
            })
            .then(loginData => {
              if (!role) throw new Error('User role must be specified.');
              role = role.toUpperCase();
              return trx('login_role')
                .insert({
                  login_id: loginData[0].id,
                  user_id: loginData[0].user_id,
                  role
                })
                .then(() => {
                  return trx('email').insert({
                    email,
                    is_primary: true,
                    user_id: loginData[0].user_id
                  });
                })
                .then(() => {
                  if (phone) {
                    phone_type = phone_type ? phone_type.toLowerCase() : null;
                    return trx('phone').insert({
                      phone,
                      phone_type,
                      is_primary: true,
                      user_id: loginData[0].user_id
                    });
                  }
                });
            })
            .then(() => {
              const token = signToken(userData[0].id, role);
              res.header('x-auth-token', token).json({
                ...userData[0],
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
            'Failed to create new user. User account with this email or phone number already exists.'
          );
      else if (err.message.includes('foreign key'))
        res.status(503).send('Failed to create new user. Invalid user role.');
      else res.status(503).send('Failed to create user. ' + err);
    });
  } catch (err) {
    res.status(503).send('Failed to create user.');
  }
};
