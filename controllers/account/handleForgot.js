const message = require('../email/messages/passwordReset');

module.exports = async (
  req,
  res,
  db,
  bcrypt,
  crypto,
  sendMail,
  config,
  snapshot
) => {
  try {
    const MINUTES_TO_EXPIRATION = 45;
    const token = crypto
      .randomBytes(24)
      .toString('base64')
      .replace(/\W/g, '');
    const hash = await bcrypt.hash(token, config.BCRYPT_COST_FACTOR);
    const now = new Date();
    let expiration = new Date();
    expiration.setMinutes(expiration.getMinutes() + MINUTES_TO_EXPIRATION);
    const ids = await db('login')
      .where('email', req.body.email)
      .returning('*')
      .update({
        reset_token_hash: hash,
        reset_token_expiration: expiration.toISOString(),
        updated_at: now
      })
      .then(data => data[0]);

    // Resetting via the LOGIN ID and NOT the account_id!
    if (!ids) throw new Error('email not found');

    const history = await snapshot(
      req,
      db,
      ids.account_id,
      ids.account_id,
      'DELETE'
    );

    const names = await db('account')
      .select(['first_name', 'last_name', 'company_name'])
      .where('id', ids.account_id);

    const resetMessage = message(ids.id, token, names[0].first_name);
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
