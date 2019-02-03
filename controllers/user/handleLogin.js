module.exports = (req, res, db, bcrypt, jwt, signToken, config) => {
  db.select('id', 'email', 'hash', 'user_id')
    .from('login')
    .where('email', '=', req.body.email)
    .then(data => {
      bcrypt.compare(req.body.password, data[0].hash, (err, isValid) => {
        if (!isValid) return res.status(401).json('bad credentials');
        db.select('role')
          .from('login_role')
          .where('login_id', '=', data[0].id)
          .then(role => {
            const token = signToken(data[0].user_id, role[0]);
            return res.header('x-auth-token', token).json('success');
          });
      });
    })
    .catch(err => res.status(401).json('bad credentials'));
};
