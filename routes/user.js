const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const valLogin = require('../middleware/validation/user/valLogin');
const valRegister = require('../middleware/validation/user/valRegister');
const valUpdate = require('../middleware/validation/user/valUpdate');
const valList = require('../middleware/validation/user/valList');
const valForgot = require('../middleware/validation/user/valForgot');
const valReset = require('../middleware/validation/user/valReset');
const db = require('../db/db');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const config = require('../config');
const handleGet = require('../controllers/user/handleGet');
const handleLogin = require('../controllers/user/handleLogin');
const handleRegister = require('../controllers/user/handleRegister');
const handleDelete = require('../controllers/user/handleDelete');
const handleUpdate = require('../controllers/user/handleUpdate');
const handleForgot = require('../controllers/user/handleForgot');
const handleReset = require('../controllers/user/handleReset');
const handleList = require('../controllers/user/handleList');
const signToken = require('../controllers/user/signToken');
const sendMail = require('../controllers/email/sendMail');

//Try to use dependency injection where possible.
router
  .route('/')
  .get(auth, (req, res) => handleGet(req, res, db))
  .all((req, res) => {
    res.status(405).send('request method not supported for this page');
  });

router
  .route('/login')
  .post(valLogin, (req, res) =>
    handleLogin(req, res, db, bcrypt, jwt, signToken, config)
  )
  .all((req, res) => {
    res.status(405).send('request method not supported for this page');
  });

router
  .route('/register')
  .post([auth, admin, valRegister], (req, res) =>
    handleRegister(req, res, db, bcrypt, config)
  )
  .all((req, res) => {
    res.status(405).send('request method not supported for this page');
  });

router
  .route('/forgot')
  .post(valForgot, (req, res) =>
    handleForgot(req, res, db, bcrypt, crypto, sendMail, config)
  )
  .all((req, res) => {
    res.status(405).send('request method not supported for this page');
  });

router
  .route('/reset/:id/:token')
  .post(valReset, (req, res) => handleReset(req, res, db, bcrypt, config))
  .all((req, res) => {
    res.status(405).send('request method not supported for this page');
  });

router
  .route('/list')
  .get([auth, admin, valList], (req, res) => handleList(req, res, db, config))
  .all((req, res) => {
    res.status(405).send('request method not supported for this page1');
  });

router
  .route('/:id')
  .delete(auth, (req, res) => handleDelete(req, res, db))
  .put([auth, valUpdate], (req, res) =>
    handleUpdate(req, res, db, bcrypt, config)
  )
  .all((req, res) => {
    res.status(405).send('request method not supported for this page');
  });

module.exports = router;
