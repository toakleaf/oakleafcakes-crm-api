module.exports = (req, res, db, bcrypt, jwt, signToken, config) => {
  db.select('email', 'hash', 'account_id')
    .from('login')
    .where('email', '=', req.body.email)
    .then(data => {
      bcrypt.compare(req.body.password, data[0].hash, (err, isValid) => {
        if (!isValid) return res.status(401).json('bad credentials');
        db.select('role')
          .from('account_role')
          .where('account_id', '=', data[0].account_id)
          .then(role => {
            const token = signToken(data[0].account_id, role[0].role);
            return res.header('x-auth-token', token).json('success');
          });
      });
    })
    .catch(err => res.status(401).json('bad credentials'));
};
