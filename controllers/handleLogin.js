const handleLogin = (req, res, db, bcrypt, jwt, config) => {
  db.select('email', 'hash', 'user_id', 'is_admin')
    .from('login')
    .where('email', '=', req.body.email)
    .then(data => {
      bcrypt.compare(req.body.password, data[0].hash, (err, isValid) => {
        if (isValid) {
          const jwtPayload = {
            user_id: data[0].user_id,
            is_admin: data[0].is_admin
          };
          const token = jwt.sign(jwtPayload, config.JWT_KEY, {
            expiresIn: config.JWT_EXPIRATION
          });
          return res.header('x-auth-token', token).json('success');
        } else {
          res.status(401).json('bad credentials');
        }
      });
    })
    .catch(err => res.status(401).json('bad credentials'));
};

module.exports = handleLogin;
