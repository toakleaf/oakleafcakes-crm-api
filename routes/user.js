const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const db = require('../db/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const handleLogin = require('../controllers/handleLogin');
const handleRegister = require('../controllers/handleRegister');
const handleDelete = require('../controllers/handleDelete');

router
  .route('/')
  .get(auth, (req, res) => res.send('respond with a resource'))
  .all((req, res) => {
    res.status(405).send('request method not supported for this page');
  });

router
  .route('/login')
  .post((req, res) => handleLogin(req, res, db, bcrypt, jwt, config))
  .all((req, res) => {
    res.status(405).send('request method not supported for this page');
  });

router
  .route('/register')
  .post([auth, admin], (req, res) => handleRegister(req, res, db, bcrypt))
  .all((req, res) => {
    res.status(405).send('request method not supported for this page');
  });

router
  .route('/delete/:id')
  .delete(auth, (req, res) => handleDelete(req, res, db))
  .all((req, res) => {
    res.status(405).send('request method not supported for this page');
  });

module.exports = router;
