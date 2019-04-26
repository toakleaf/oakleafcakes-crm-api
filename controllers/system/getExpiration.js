module.exports = (req, res, config) => {
  return res.json({ expiration: config.JWT_EXPIRATION });
};
