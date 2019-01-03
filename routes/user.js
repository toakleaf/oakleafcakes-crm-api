const express = require('express');
const router = express.Router();
const db = require('../db/db');
const bcrypt = require('bcryptjs');
const handleLogin = require('../controllers/handleLogin');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router
  .route('/login')
  .post((req, res) => handleLogin(req, res, db, bcrypt))
  .all((req, res) => {
    res.status(405).send('request method not supported for this page');
  });

module.exports = router;
