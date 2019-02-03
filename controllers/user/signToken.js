const jwt = require('jsonwebtoken');
const config = require('../../config');

module.exports = (user_id, role, expiresIn = '12h') => {
  const token = jwt.sign({ user_id, role }, config.JWT_KEY, {
    expiresIn: expiresIn
  });
  return token;
};
