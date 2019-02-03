const jwt = require('jsonwebtoken');
const config = require('../config');

module.exports = function(req, res, next) {
  const tokenString = req.header('Authorization');
  if (!tokenString)
    return res.status(401).json('Access denied. Missing token.');
  try {
    // header should be "Authorization: Bearer jwt" format
    const token = tokenString.substring(7);
    const jwtPayload = jwt.verify(token, config.JWT_KEY);
    req.account = jwtPayload; //create a account object in the req
    next();
  } catch (ex) {
    res.status(400).json('Invalid token.');
  }
};
