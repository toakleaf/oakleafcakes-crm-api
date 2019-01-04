// This middleware is designed to disallow general public access to the api.

const config = require('../config.js');

module.exports = function(req, res, next) {
  //must be called after middleware/auth to get req.user data
  const apiKey = req.header('x-api-key');
  console.log(apiKey);
  if (!apiKey) return res.status(401).json('Access denied. Missing API Key.');
  if (apiKey !== config.API_KEY)
    return res.status(403).json('Access denied. Invalid API Key.');
  next();
};
