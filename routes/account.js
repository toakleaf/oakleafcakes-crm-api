const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const employee = require('../middleware/employee');
const valLogin = require('../middleware/validation/account/valLogin');
const valRegister = require('../middleware/validation/account/valRegister');
const valSignUp = require('../middleware/validation/account/valSignUp');
const valUpdate = require('../middleware/validation/account/valUpdate');
const valSearch = require('../middleware/validation/account/valSearch');
const valHistory = require('../middleware/validation/account/valHistory');
const valPreferences = require('../middleware/validation/account/valPreferences');
const valForgot = require('../middleware/validation/account/valForgot');
const valDeletePassword = require('../middleware/validation/account/valDeletePassword');
const valDeleteEmail = require('../middleware/validation/account/valDeleteEmail');
const valDeletePhone = require('../middleware/validation/account/valDeletePhone');
const valReset = require('../middleware/validation/account/valReset');
const valVerify = require('../middleware/validation/account/valVerify');
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
const deletePassword = require('../controllers/account/deletePassword');
const deleteEmail = require('../controllers/account/deleteEmail');
const deletePhone = require('../controllers/account/deletePhone');
const handleVerify = require('../controllers/account/handleVerify');
const handleReset = require('../controllers/account/handleReset');
const handleSearch = require('../controllers/account/handleSearch');
const handleHistory = require('../controllers/account/handleHistory');
const getPreferences = require('../controllers/account/getPreferences');
const postPreferences = require('../controllers/account/postPreferences');
const signToken = require('../controllers/account/signToken');
const snapshot = require('../controllers/account/snapshot');
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
  .route('/register') //for accounts registering accounts
  .post([auth, employee, valRegister], (req, res) => {
    if (req.body.password)
      createAccountWithLogin(
        req,
        res,
        db,
        crypto,
        bcrypt,
        config,
        sendMail,
        snapshot
      );
    else createAccount(req, res, db, snapshot);
  })
  .all((req, res) => {
    res.status(405).send('request method not supported for this page');
  });

router
  .route('/signup') //for general public registering themselves or claiming existing accounts (for previous non-ecommerce customers)
  .post([valSignUp], (req, res) =>
    handleSignUp(req, res, db, crypto, bcrypt, config, sendMail, snapshot)
  )
  .all((req, res) => {
    res.status(405).send('request method not supported for this page');
  });

router
  .route('/forgot')
  .post(valForgot, (req, res) =>
    handleForgot(req, res, db, bcrypt, crypto, sendMail, config, snapshot)
  )
  .all((req, res) => {
    res.status(405).send('request method not supported for this page');
  });

router
  .route('/password')
  .delete(auth, admin, valDeletePassword, (req, res) =>
    deletePassword(req, res, db, bcrypt, crypto, sendMail, config, snapshot)
  )
  .all((req, res) => {
    res.status(405).send('request method not supported for this page');
  });

router
  .route('/email/:id')
  .delete(auth, valDeleteEmail, (req, res) =>
    deleteEmail(req, res, db, snapshot)
  )
  .all((req, res) => {
    res.status(405).send('request method not supported for this page');
  });

router
  .route('/phone/:id')
  .delete(auth, valDeletePhone, (req, res) =>
    deletePhone(req, res, db, snapshot)
  )
  .all((req, res) => {
    res.status(405).send('request method not supported for this page');
  });

router
  .route('/verify/:id/:token')
  .post(valVerify, (req, res) =>
    handleVerify(req, res, db, bcrypt, signToken, config, snapshot)
  )
  .all((req, res) => {
    res.status(405).send('request method not supported for this page');
  });

router
  .route('/reset/:id/:token')
  .post(valReset, (req, res) =>
    handleReset(req, res, db, bcrypt, signToken, config, snapshot)
  )
  .all((req, res) => {
    res.status(405).send('request method not supported for this page');
  });

router
  .route('/search')
  .get([auth, employee, valSearch], (req, res) =>
    handleSearch(req, res, db, config)
  )
  .all((req, res) => {
    res.status(405).send('request method not supported for this page');
  });

router
  .route('/history/:id')
  .get([auth, employee, valSearch], (req, res) => handleHistory(req, res, db))
  .all((req, res) => {
    res.status(405).send('request method not supported for this page');
  });

router
  .route('/preferences/')
  .get([auth], (req, res) => getPreferences(req, res, db))
  .post([auth, valPreferences], (req, res) => postPreferences(req, res, db))
  .all((req, res) => {
    res.status(405).send('request method not supported for this page');
  });

router
  .route('/:id')
  .get(auth, (req, res) => handleGet(req, res, db))
  .delete([auth, admin], (req, res) => handleDelete(req, res, db, snapshot))
  .put([auth, valUpdate], (req, res) =>
    handleUpdate(req, res, db, crypto, bcrypt, config, snapshot)
  )
  .all((req, res) => {
    res.status(405).send('request method not supported for this page');
  });

module.exports = router;
