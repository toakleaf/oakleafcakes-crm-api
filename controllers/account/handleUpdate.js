module.exports = async (req, res, db, crypto, bcrypt, config) => {
  const {
    emails,
    password,
    role,
    first_name,
    last_name,
    company_name,
    phones,
    is_active
  } = req.body;

  const now = new Date(Date.now());
  const accountUpdates = {
    ...(first_name ? { first_name } : {}),
    ...(first_name === '' ? { first_name: null } : {}),
    ...(last_name ? { last_name } : {}),
    ...(last_name === '' ? { last_name: null } : {}),
    ...(company_name ? { company_name } : {}),
    ...(company_name === '' ? { company_name: null } : {}),
    updated_at: now
  };
  const roleUpdates = {
    ...(role ? { role } : {}),
    updated_at: now
  };

  // EMAILS
  const existingEmails = emails
    ? await db('email')
        .select('*')
        .where({ account_id: req.params.id })
        .then(e => e)
    : null;
  const existingPrimaryEmails = existingEmails
    ? existingEmails.filter(e => e.is_primary)
    : null;
  const reqPrimaryEmails = emails ? emails.filter(e => e.is_primary) : null;

  // PHONES
  if (phones) {
    for (let i = 0; i < phones.length; i++) {
      phones[i].new_phone_raw = phones[i].new_phone
        ? phones[i].new_phone.replace(/[^0-9]/g, '')
        : null;
      phones[i].current_phone_raw = phones[i].current_phone
        ? phones[i].current_phone.replace(/[^0-9]/g, '')
        : null;
    }
  }
  const existingPhones = phones
    ? await db('phone')
        .select('*')
        .where({ account_id: req.params.id })
        .then(p => p)
    : null;
  const existingPhonesRaw = existingPhones
    ? existingPhones.map(p => p.phone_raw)
    : null;
  const existingPrimaryPhones = existingPhones
    ? existingPhones.filter(p => p.is_primary)
    : null;
  const reqPrimaryPhones = phones
    ? phones.filter(p => p.is_primary === true)
    : null;

  // PASSWORDS
  const hash = password
    ? await bcrypt.hash(password, config.BCRYPT_COST_FACTOR)
    : null;
  // if is_login flag but no password, generate a dummy password hash
  const dummyHashes =
    emails && !password
      ? await emails
          .filter(e => e.is_login)
          .map(async e => {
            const token = crypto
              .randomBytes(24)
              .toString('base64')
              .replace(/\W/g, '');
            const hash = await bcrypt.hash(token, config.BCRYPT_COST_FACTOR);
            return hash;
          })
      : [];

  // VALIDATION ENSURING ONLY 1 PRIMARY EMAIL OR PHONE PER REQ
  if (
    (reqPrimaryEmails && reqPrimaryEmails.length > 1) ||
    (reqPrimaryPhones && reqPrimaryPhones.length > 1)
  ) {
    res
      .status(503)
      .send(
        'Failed to update account. Account can not contain more than 1 primary email or phone number'
      );
  }

  db.transaction(trx => {
    trx('account')
      .where('id', req.params.id)
      .returning('*')
      .update(accountUpdates)
      .then(accountData => {
        if (accountData.length == 0) throw new Error('Invalid id');
        if (!role) return;
        return trx('account_role')
          .where('account_id', req.params.id)
          .update(roleUpdates);
      })
      .then(() => {
        //if e.is_primary, first reset ALL of account's emails to is_primary = false
        if (
          !existingPrimaryEmails ||
          !reqPrimaryEmails ||
          !existingPrimaryEmails.length ||
          !reqPrimaryEmails.length ||
          reqPrimaryEmails[0].email === existingPrimaryEmails[0].email
        ) {
          return;
        }
        return trx('email')
          .where({ account_id: req.params.id, is_primary: true })
          .update({ is_primary: false });
      })
      .then(() => {
        //if e.is_primary, first reset ALL of account's emails to is_primary = false
        if (
          !existingPrimaryPhones ||
          !reqPrimaryPhones ||
          !existingPrimaryPhones.length ||
          !reqPrimaryPhones.length ||
          reqPrimaryPhones[0].phone_raw === existingPrimaryPhones[0].phone_raw
        ) {
          return;
        }
        return trx('phone')
          .where({ account_id: req.params.id, is_primary: true })
          .update({ is_primary: false });
      })
      .then(() => {
        // if a global is_active is set to false, make all logins inactive.
        // is_active === true does nothing. must instead reactivate logins individually.
        if (is_active === false) {
          return trx('login')
            .where({ account_id: req.params.id, is_active: true })
            .update({ is_active: false });
        }
      })
      .then(() => {
        if (!emails) return;
        const queries = [];

        emails.forEach(e => {
          const update = {
            ...(e.new_email ? { email: e.new_email } : {}),
            ...(!e.new_email && e.current_email
              ? { email: e.current_email }
              : {}),
            ...(e.is_primary || e.is_primary === false
              ? { is_primary: e.is_primary }
              : {}),
            ...(!existingEmails.length ? { is_primary: true } : {})
          };
          const emailQuery = e.current_email
            ? db('email')
                .transacting(trx)
                .where({ account_id: req.params.id, email: e.current_email })
                .update({ ...update, updated_at: now })
            : db('email')
                .transacting(trx)
                .insert({ ...update, account_id: req.params.id });

          // if email to update is also a login, update login too.
          const loginQuery = e.current_email
            ? db('login')
                .transacting(trx)
                .where({ email: e.current_email })
                .returning('id')
                .update({
                  ...(e.new_email ? { email: e.new_email } : {}),
                  updated_at: now,
                  ...(e.is_active === true || e.is_active === false
                    ? { is_active: e.is_active }
                    : {}),
                  ...(password ? { hash } : {})
                })
                .then(login => {
                  // only insert new login if none exists and is_login flag is set to true
                  if (login.length || e.is_login !== true) return;
                  return db('login')
                    .transacting(trx)
                    .insert({
                      account_id: req.params.id,
                      ...(e.new_email
                        ? { email: e.new_email }
                        : { email: e.current_email }),
                      ...(e.is_active === true || e.is_active === false
                        ? { is_active: e.is_active }
                        : { is_active: false }), // is_active defaults to false if left null
                      ...(password ? { hash } : { hash: dummyHashes.pop() })
                    });
                })
            : e.is_login
            ? // just insert login if new_email only and is_login flag is set to true
              db('login')
                .transacting(trx)
                .insert({
                  account_id: req.params.id,
                  email: e.new_email,
                  ...(e.is_active === true || e.is_active === false
                    ? { is_active: e.is_active }
                    : { is_active: false }), // is_active defaults to false if left null
                  ...(password ? { hash } : { hash: dummyHashes.pop() })
                })
            : null;

          queries.push(emailQuery, loginQuery);
        });
        return Promise.all(queries);
      })
      .then(() => {
        if (!phones) return;
        const queries = [];

        phones.forEach(p => {
          const update = {
            ...(p.new_phone ? { phone: p.new_phone } : {}),
            ...(!p.new_phone && p.current_phone
              ? { phone: p.current_phone }
              : {}),
            ...(p.new_phone ? { phone_raw: p.new_phone_raw } : {}),
            ...(!p.new_phone && p.current_phone
              ? { phone_raw: p.current_phone_raw }
              : {}),
            ...(p.phone_type ? { phone_type: p.phone_type } : {}),
            ...(p.phone_country
              ? { phone_country: p.phone_country }
              : { phone_country: 'US' }),
            ...(p.is_primary || p.is_primary === false
              ? { is_primary: p.is_primary }
              : {}),
            ...(!existingPhones.length ? { is_primary: true } : {})
          };
          const queryPhone =
            existingPhonesRaw &&
            (existingPhonesRaw.includes(p.current_phone_raw) ||
              existingPhonesRaw.includes(p.new_phone_raw))
              ? db('phone')
                  .where(qb => {
                    if (p.current_phone) {
                      return qb
                        .where({
                          account_id: req.params.id,
                          phone_raw: p.new_phone_raw
                        })
                        .orWhere({
                          account_id: req.params.id,
                          phone_raw: p.current_phone_raw
                        });
                    }
                    return qb.where({
                      account_id: req.params.id,
                      phone_raw: p.new_phone_raw
                    });
                  })
                  .update({ ...update, updated_at: now })
                  .transacting(trx)
              : db('phone') //insert new record if phone_raw doesn't exist
                  .insert({ ...update, account_id: req.params.id })
                  .transacting(trx);

          queries.push(queryPhone);
        });
        return Promise.all(queries);
      })
      .then(() => {
        return trx('account_history').insert({
          account_id: req.params.id,
          author: req.account.account_id,
          action: 'UPDATE',
          transaction: req.body
        });
      })
      .then(() => {
        trx.commit();
        return res.send(`account #${req.params.id} updated successfully.`);
      })
      .catch(err => {
        trx.rollback();
        console.error(err);
        return res.status(503).send('Failed to update account. ');
      });
  }).catch(err => {
    console.error(err);
    if (err.message.includes('duplicate key')) {
      res
        .status(503)
        .send(
          'Failed to update account. Account with this email address already exists.'
        );
    } else {
      res.status(503).send('Failed to update account. ');
    }
  });
};
