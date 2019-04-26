module.exports = (req, res, signToken, config) => {
  config.JWT_EXPIRATION = req.body.quantity + req.body.unit;
  return res.send('success');
};
