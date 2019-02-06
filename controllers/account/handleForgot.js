const message = require('../email/messages/passwordReset');

module.exports = async (req, res, db, bcrypt, crypto, sendMail, config) => {
  try {
    const MINUTES_TO_EXPIRATION = 45;
    var token = crypto
      .randomBytes(24)
      .toString('base64')
      .replace(/\W/g, '');
    const hash = await bcrypt.hash(token, config.BCRYPT_COST_FACTOR);
    const expiration = new Date(Date.now());
    expiration.setMinutes(expiration.getMinutes() + MINUTES_TO_EXPIRATION);
    const ids = await db('login')
      .where('email', req.body.email)
      .returning(['id', 'account_id'])
      .update({
        reset_token_hash: hash,
        reset_token_expiration: expiration.toISOString(),
        updated_at: new Date(Date.now())
      });
    if (!ids[0].id) throw new Error('email not found');
    const names = await db('account')
      .select(['first_name', 'last_name', 'company_name'])
      .where('id', ids[0].account_id);

    const resetMessage = message(ids[0].id, token, names[0].first_name);
    const sent = await sendMail({
      ...resetMessage,
      to: req.body.email,
      from: `${config.COMPANY_NAME} Password Reset <noreply@${
        config.COMPANY_SITE
      }>`
    });
    res.send('ok');
  } catch (err) {
    // console.error(err);
    //Don't reveal error to end account
    res.send('ok');
  }
};
