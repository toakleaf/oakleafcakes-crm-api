module.exports = (req, res, config) => {
  config.JWT_EXPIRATION = req.body.quantity + req.body.unit;
  return res.send('success');
};
