module.exports = function(req, res, next) {
  //must be called after middleware/auth to get req.user data
  if (!req.user.is_admin) return res.status(403).json('Access denied.');
  next();
};
