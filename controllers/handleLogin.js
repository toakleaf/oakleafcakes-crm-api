const handleLogin = (req, res, db, bcrypt) => {
  db.select('email', 'hash')
    .from('login')
    .where('email', '=', req.body.email)
    .then(data => {
      bcrypt.compare(req.body.password, data[0].hash, (err, isValid) => {
        if (isValid) {
          return db
            .select('*')
            .from('users')
            .where('email', '=', req.body.email)
            .then(user => {
              res.json(user[0]);
            })
            .catch(err => res.status(400).json('unable to get user'));
        } else {
          res.status(401).json('bad credentials');
        }
      });
    })
    .catch(err => res.status(401).json('bad credentials'));
};

module.exports = handleLogin;
