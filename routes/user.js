const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const joiLogin = require('../middleware/joiLogin');
const joiRegister = require('../middleware/joiRegister');
const db = require('../db/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const handleLogin = require('../controllers/handleLogin');
const handleRegister = require('../controllers/handleRegister');
const handleDelete = require('../controllers/handleDelete');
const handleUpdate = require('../controllers/handleUpdate');

//Try to use dependency injection where possible.
router
  .route('/')
  .get(auth, (req, res) => res.send('respond with a resource'))
  .all((req, res) => {
    res.status(405).send('request method not supported for this page');
  });

router
  .route('/login')
  .post(joiLogin, (req, res) => handleLogin(req, res, db, bcrypt, jwt, config))
  .all((req, res) => {
    res.status(405).send('request method not supported for this page');
  });

router
  .route('/register')
  .post([auth, admin, joiRegister], (req, res) =>
    handleRegister(req, res, db, bcrypt)
  )
  .all((req, res) => {
    res.status(405).send('request method not supported for this page');
  });

router
  .route('/:id')
  .delete(auth, (req, res) => handleDelete(req, res, db))
  .put(auth, (req, res) => handleUpdate(req, res, db, bcrypt))
  .all((req, res) => {
    res.status(405).send('request method not supported for this page');
  });

module.exports = router;
