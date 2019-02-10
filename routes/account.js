const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const valLogin = require('../middleware/validation/account/valLogin');
const valCreateAccount = require('../middleware/validation/account/valCreateAccount');
const valUpdate = require('../middleware/validation/account/valUpdate');
const valSearch = require('../middleware/validation/account/valSearch');
const valForgot = require('../middleware/validation/account/valForgot');
const valReset = require('../middleware/validation/account/valReset');
const db = require('../db/db');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const config = require('../config');
const handleGet = require('../controllers/account/handleGet');
const handleLogin = require('../controllers/account/handleLogin');
const handleSignUp = require('../controllers/account/handleSignUp');
const createAccountWithLogin = require('../controllers/account/createAccountWithLogin');
const createAccount = require('../controllers/account/createAccount');
const handleDelete = require('../controllers/account/handleDelete');
const handleUpdate = require('../controllers/account/handleUpdate');
const handleForgot = require('../controllers/account/handleForgot');
const handleReset = require('../controllers/account/handleReset');
const handleSearch = require('../controllers/account/handleSearch');
const signToken = require('../controllers/account/signToken');
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
  .route('/register') //private internal route
  .post([auth, admin, valCreateAccount], (req, res) => {
    if (req.body.password)
      createAccountWithLogin(req, res, db, bcrypt, signToken, config, sendMail);
    else createAccount(req, res, db);
  })
  .all((req, res) => {
    res.status(405).send('request method not supported for this page');
  });

router
  .route('/signup') //public route
  .post([valCreateAccount], (req, res) =>
    handleSignUp(req, res, db, bcrypt, signToken, config, sendMail)
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
  .post(valReset, (req, res) =>
    handleReset(req, res, db, bcrypt, signToken, config)
  )
  .all((req, res) => {
    res.status(405).send('request method not supported for this page');
  });

router
  .route('/search')
  .get([auth, admin, valSearch], (req, res) =>
    handleSearch(req, res, db, config)
  )
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
