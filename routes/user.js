const express = require('express');
const router = express.Router();
const db = require('../db/db');
const bcrypt = require('bcryptjs');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router
  .route('/login')
  .post((req, res) => {
    db.select('email', 'hash')
      .from('login')
      .where('email', '=', req.body.email)
      .then(data => {
        const isValid = bcrypt.compareSync(req.body.password, data[0].hash);
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
          res.status(401).json('bad credentials 1');
        }
      })
      .catch(err => res.status(401).json('bad credentials 2'));
  })
  .all((req, res) => {
    res.status(405).send('request method not supported for this page');
  });

module.exports = router;
