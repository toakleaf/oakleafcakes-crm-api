const jwt = require('jsonwebtoken');
const config = require('../../config');

module.exports = (account_id, role, expiresIn = '1d') => {
  const token = jwt.sign({ account_id, role }, config.JWT_KEY, {
    expiresIn: expiresIn
  });
  return token;
};
