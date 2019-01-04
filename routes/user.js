const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const db = require('../db/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const handleLogin = require('../controllers/handleLogin');

/* GET users listing. */
router.get('/', auth, function(req, res, next) {
  res.send('respond with a resource');
});

router
  .route('/login')
  .post((req, res) => handleLogin(req, res, db, bcrypt, jwt, config))
  .all((req, res) => {
    res.status(405).send('request method not supported for this page');
  });

router
  .route('/register')
  .post((req, res) => handleLogin(req, res, db, bcrypt, jwt, config))
  .all((req, res) => {
    res.status(405).send('request method not supported for this page');
  });

module.exports = router;
