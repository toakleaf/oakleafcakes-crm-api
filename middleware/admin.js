module.exports = function(req, res, next) {
  //must be called after middleware/auth to get req.account data
  if (req.account.role !== 'ADMIN')
    return res.status(403).json('Access denied.');
  next();
};
