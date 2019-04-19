const message = require('../email/messages/verifyAccount');

module.exports = async (req, res, db, crypto, bcrypt, config, sendMail, id) => {
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
      trx('account_history')
        .insert({
          account_id: id,
          author: id,
          action: 'CREATE',
          transaction: {
            email,
            hash
          }
        })
        .then(() => {
          return trx('account_history').insert({
            account_id: id,
            author: id,
            action: 'UPDATE',
            transaction: {
              pending: true,
              first_name,
              last_name,
              company_name,
              email,
              role,
              phone,
              phone_type,
              phone_country
            }
          });
        })
        .then(() => {
          return trx('login').insert({
            account_id: id,
            email,
            hash
          });
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
          res.send('Verification Email Sent');
        })
        .then(trx.commit)
        .catch(trx.rollback);
    });
  } catch (err) {
    res.status(503).send('Failed to create account.' + err);
  }
};
