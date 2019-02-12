module.exports = async (
  req,
  res,
  db,
  bcrypt,
  signToken,
  config,
  sendMail,
  id
) => {
  let {
    email,
    password,
    role,
    first_name,
    last_name,
    company_name,
    phone,
    phone_type
  } = req.body;

  try {
    const hash = await bcrypt.hash(password, config.BCRYPT_COST_FACTOR);
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
              phone_type
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
        .then(trx.commit)
        .catch(trx.rollback);
    });
  } catch (err) {
    res.status(503).send('Failed to create account.');
  }
};
