const message = require('../email/messages/deletePassword');

module.exports = async (
  req,
  res,
  db,
  bcrypt,
  crypto,
  sendMail,
  config,
  saveHistorySnapshot
) => {
  //if req.body.lock === true then don't send the reset email, so user gets locked out of account.
  try {
    const DAYS_TO_EXPIRATION = 7;
    const token = crypto
      .randomBytes(24)
      .toString('base64')
      .replace(/\W/g, '');
    const token2 = crypto
      .randomBytes(24)
      .toString('base64')
      .replace(/\W/g, '');
    const hash = await bcrypt.hash(token, config.BCRYPT_COST_FACTOR);
    const expiration = new Date(Date.now());
    expiration.setDate(expiration.getDate() + DAYS_TO_EXPIRATION);
    const ids = await db('login')
      .where('email', req.body.email)
      .returning(['id', 'account_id'])
      .update({
        hash: token2,
        updated_at: new Date(),
        ...(req.body.lock
          ? { is_active: false }
          : {
              reset_token_hash: hash,
              reset_token_expiration: expiration.toISOString()
            })
      })
      .then(data => {
        // return db('account_history')
        //   .insert({
        //     account_id: data[0].account_id,
        //     author: req.account.account_id,
        //     action: 'DELETE',
        //     transaction: {
        //       hash: 'RANDOM',
        //       updated_at: new Date(),
        //       ...(req.body.lock
        //         ? { is_active: false }
        //         : {
        //             reset_token_hash: hash,
        //             reset_token_expiration: expiration.toISOString()
        //           })
        //     }
        //   })
        // .then(() => {
        return data[0];
        // });
      });

    if (!ids.id) throw new Error('email not found');

    const history = await saveHistorySnapshot(
      req,
      db,
      ids.account_id,
      req.account.account_id,
      'DELETE'
    );

    if (!req.body.lock) {
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
    }
    res.send('ok');
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to reset password');
  }
};
