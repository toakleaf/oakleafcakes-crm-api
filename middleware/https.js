module.exports = function(req, res, next) {
  if (!req.secure)
    return res
      .status(401)
      .json('Access denied. Secure HTTPS connection required');
  next();
};
