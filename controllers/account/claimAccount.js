const message = require('../email/messages/verifyAccount');

module.exports = async (
  req,
  res,
  db,
  crypto,
  bcrypt,
  config,
  sendMail,
  id,
  snapshot
) => {
  let {
    email,
    password,
    role,
    first_name,
    last_name,
    company_name,
    phone,
    phone_type,
    phone_country
  } = req.body;

  try {
    const hash = await bcrypt.hash(password, config.BCRYPT_COST_FACTOR);
    const token = crypto
      .randomBytes(24)
      .toString('base64')
      .replace(/\W/g, '');
    const activation_hash = await bcrypt.hash(token, config.BCRYPT_COST_FACTOR);

    await db.transaction(trx => {
      trx('login')
        .insert({
          account_id: id,
          email,
          hash
        })
        .then(() => {
          return trx('activation_hash').insert({
            hash: activation_hash,
            account_id: id
          });
        })
        .then(() => {
          const verifyMessage = message(id, token, first_name || 'there');
          return sendMail({
            ...verifyMessage,
            to: email,
            from: `${config.COMPANY_NAME} Account Verification <noreply@${
              config.COMPANY_SITE
            }>`
          });
        })
        .then(() => {
          return snapshot(req, db, id, id, 'UPDATE', 'PENDING');
        })
        .then(() => {
          res.send('Verification Email Sent');
        })
        .then(trx.commit)
        .catch(trx.rollback);
    });
  } catch (err) {
    console.error(err);
    res.status(503).send('Failed to create account.' + err);
  }
};
