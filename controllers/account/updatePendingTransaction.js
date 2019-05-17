module.exports = async (db, id, request, saveHistorySnapshot) => {
  const {
    email,
    first_name,
    last_name,
    company_name,
    phone,
    phone_type,
    phone_country
  } = request;
  let phone_raw = phone ? phone.replace(/[^0-9]/g, '') : null;

  const now = new Date(Date.now());

  // user tries to register new account, system finds matching email, saves all submitted info to transaction history
  // user verifies account and now that history gets drug out to update account info
  // user submitted email address should be set to primary email address. no matter what that address should already exist

  // if different primary email address, we need to set is_primary to false.  Set the new_prime_email to is_prime
  // phone numbers may or may not exist. Need to search for them.
  // if current_prime_phone different, then need to set its is_prime to false.
  // if new_prime_phone in db, then we need to set its is_prime to true. Otherwise we need to create new phone record.
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
            .where({ account_id: id, is_primary: true })
            .update({ is_primary: false });
        })
        .then(() => {
          return trx('email')
            .where({ account_id: id, email })
            .update({ is_primary: true });
        })
        .then(() => {
          return trx('phone')
            .select('*')
            .where({ account_id: id, phone_raw })
            .then(p => p[0]);
        })
        .then(p => {
          if (p && !p.is_primary) {
            return trx('phone')
              .where({ account_id: id, is_primary: true })
              .update({ is_primary: false, updated_at: now })
              .then(() => {
                return trx('phone')
                  .where({ account_id: id, phone_raw })
                  .update({
                    phone,
                    is_primary: true,
                    phone_type,
                    phone_country,
                    updated_at: now
                  });
              });
          }
          if (p) {
            return trx('phone')
              .where({ account_id: id, phone_raw })
              .update({ phone, phone_type, phone_country, updated_at: now });
          }
          return trx('phone')
            .where({ account_id: id, is_primary: true })
            .update({ is_primary: false, updated_at: now })
            .then(() => {
              return trx('phone').insert({
                account_id: id,
                phone,
                phone_raw,
                is_primary: true,
                phone_type,
                phone_country,
                updated_at: now
              });
            });
        })
        .then(() => {
          return saveHistorySnapshot(
            { ...request, ...(phone_raw ? { phone_raw } : {}) },
            db,
            id,
            id,
            'UPDATE'
          );
          // return trx('account_history').insert({
          //   account_id: id,
          //   author: id,
          //   action: 'UPDATE',
          //   transaction: {
          //     ...request,
          //     phone_raw
          //   }
          // });
        })
        .then(trx.commit)
        .catch(trx.rollback);
    })
    .catch(err => {
      console.error(err);
    });
};
