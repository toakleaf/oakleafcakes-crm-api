module.exports = (req, res, crypto, signToken, config) => {
  process.env.JWT_KEY = crypto
    .randomBytes(24)
    .toString('base64')
    .replace(/\W/g, '');
  config.JWT_KEY = process.env.JWT_KEY;
  const token = signToken(req.account.account_id, req.account.role);
  return res.header('x-auth-token', token).json('success');
};
