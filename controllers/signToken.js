const jwt = require('jsonwebtoken');
const config = require('../config');

module.exports = (user_id, is_admin, expiresIn = '12h') => {
  const token = jwt.sign(
    { user_id: user_id, is_admin: is_admin },
    config.JWT_KEY,
    {
      expiresIn: expiresIn
    }
  );
  return token;
};
