const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const valJWTExpires = require('../middleware/validation/system/valJWTExpires');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const config = require('../config');
const signToken = require('../controllers/account/signToken');
const jwtRefresh = require('../controllers/system/jwtRefresh');
const jwtExpiration = require('../controllers/system/jwtExpiration');

router
  .route('/jwt/refresh')
  .post(auth, admin, (req, res) =>
    jwtRefresh(req, res, crypto, signToken, config)
  )
  .all((req, res) => {
    res.status(405).send('request method not supported for this page');
  });

router
  .route('/jwt/expires')
  .put(auth, admin, valJWTExpires, (req, res) =>
    jwtExpiration(req, res, signToken, config)
  )
  .all((req, res) => {
    res.status(405).send('request method not supported for this page');
  });

module.exports = router;
