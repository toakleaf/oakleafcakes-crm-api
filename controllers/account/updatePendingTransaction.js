module.exports = async (db, id, updates) => {
  const {
    email,
    first_name,
    last_name,
    company_name,
    phone,
    phone_type
  } = updates;

  const now = new Date(Date.now());

  await db
    .transaction(trx => {
      trx('account')
        .where('id', id)
        .returning('*')
        .update({
          first_name,
          last_name,
          company_name,
          updated_at: now
        })
        .then(accountData => {
          if (accountData.length == 0) throw new Error('Invalid id');
          return trx('email')
            .where({ account_id: id, is_primary: true, email })
            .update({ email, updated_at: now })
            .then(() => {
              return trx('phone')
                .where({ account_id: id, is_primary: true, phone })
                .update({ phone, phone_type, updated_at: now });
            })
            .then(() => {
              return trx('account_history').insert({
                account_id: id,
                author: id,
                action: 'UPDATE',
                transaction: {
                  ...updates
                }
              });
            });
        })
        .then(trx.commit)
        .catch(trx.rollback);
    })
    .catch(err => {
      console.error(err);
    });
};
