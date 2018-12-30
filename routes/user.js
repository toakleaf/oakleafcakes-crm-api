const express = require('express');
const router = express.Router();
const knex = require('knex');
const bcrypt = require('bcryptjs');

const db = knex({
  client: 'pg',
  connection: process.env.POSTGRES_URI
});

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
          res.status(401).json('bad credentials');
        }
      })
      .catch(err => res.status(401).json('bad credentials'));
  })
  .all((req, res) => {
    res.status(405).send();
  });

module.exports = router;
