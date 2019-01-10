const message = require('../email/messages/passwordReset');
const { COMPANY_NAME, COMPANY_SITE } = require('../../config');
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
    const id = await db('login')
      .where('email', req.body.email)
      .returning('id')
      .update({
        reset_token_hash: hash,
        reset_token_expiration: expiration.toISOString()
      });
    if (!id[0]) throw new Error('email not found');
    const resetMessage = message(id, token);
    await sendMail(
      {
        ...resetMessage,
        to: req.body.email,
        from: `${COMPANY_NAME} Password Reset <noreply@${COMPANY_SITE}>`
      },
      err => {
        if (err) throw new Error(err);
      }
    );
    res.send('ok');
  } catch (err) {
    console.error(err);
    //Don't reveal error to end user
    res.send('ok');
  }
};
