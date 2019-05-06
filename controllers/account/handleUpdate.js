module.exports = async (req, res, db, bcrypt, config) => {
  const {
    emails,
    new_email,
    current_email,
    email_is_primary,
    password,
    role,
    first_name,
    last_name,
    company_name,
    phones,
    new_phone,
    current_phone,
    phone_is_primary,
    phone_type,
    phone_country,
    is_active
  } = req.body;
  let new_phone_raw = new_phone ? new_phone.replace(/[^0-9]/g, '') : null;
  let current_phone_raw = current_phone
    ? current_phone.replace(/[^0-9]/g, '')
    : null;

  if (phones) {
    for (p in phones) {
      p.new_phone_raw = p.new_phone ? p.new_phone.replace(/[^0-9]/g, '') : null;
      p.current_phone_raw = p.current_phone
        ? p.current_phone.replace(/[^0-9]/g, '')
        : null;
    }
  }

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

  const emailUpdates = {
    ...(new_email ? { email: new_email } : {}),
    ...(email_is_primary || email_is_primary === false
      ? { is_primary: email_is_primary }
      : {}),
    updated_at: now
  };
  const phoneUpdates = {
    ...(new_phone ? { phone: new_phone } : {}),
    ...(new_phone_raw ? { phone_raw: new_phone_raw } : {}),
    ...(phone_type ? { phone_type } : {}),
    ...(phone_country ? { phone_country } : {}),
    ...(phone_is_primary || phone_is_primary === false
      ? { is_primary: phone_is_primary }
      : {}),
    updated_at: now
  };
  const loginUpdates = {
    ...(new_email ? { email: new_email } : {}),
    ...(is_active || is_active === false ? { is_active } : {}),
    updated_at: now
  };
  const roleUpdates = {
    ...(role ? { role } : {}),
    updated_at: now
  };

  const updateLogin = emails ? emails.filter(e => e.is_login === true) : null;

  const loginRecord = updateLogin
    ? await db('login')
        .select('*')
        .where({
          account_id: req.params.id,
          ...(updateLogin.current_email
            ? { email: updateLogin.current_email }
            : {})
        })
        .then(d => d[0])
    : null;

  const updatePrimaryEmail = emails
    ? emails.filter(e => e.is_primary === true)
    : null;

  const primaryEmail = await db('email')
    .select('email')
    .where({ account_id: req.params.id, is_primary: true })
    .then(primary_email => primary_email[0]);

  const updatePrimaryPhone = phones
    ? phones.filter(p => p.is_primary === true)
    : null;
  const primaryPhoneRaw = await db('phone')
    .select('phone_raw')
    .where({ account_id: req.params.id, is_primary: true })
    .then(primary_phone_raw => primary_phone_raw[0]);

  const hash = password
    ? await bcrypt.hash(password, config.BCRYPT_COST_FACTOR)
    : null;

  // NEED TO ADD SUPPORT FOR ARRAY OF PHONES
  // NEED TO DELETE NON-ARRAY VERSIONS OF UPDATES TO CLEAN UP THIS CODE

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
        if (!updatePrimaryEmail || updatePrimaryEmail[0] === primaryEmail)
          return;
        return trx('email')
          .where({ account_id: req.params.id, is_primary: true })
          .update({ is_primary: false });
      })
      .then(() => {
        if (!emails) return;
        const queries = [];

        emails.forEach(e => {
          const update = {
            email: e.new_email,
            ...(e.email_is_primary || e.email_is_primary === false
              ? { is_primary: e.email_is_primary }
              : {})
          };
          const query = e.current_email
            ? db('email')
                .where({ account_id: req.params.id, email: e.current_email })
                .update({ ...update, updated_at: now })
                .transacting(trx) // This makes every update be in the same transaction
            : db('email')
                .insert({ ...update, account_id: req.params.id })
                .transacting(trx);

          //only update login if is_login flag.
          const login =
            loginRecord && e.is_login
              ? db('login')
                  .where({ id: loginRecord.id })
                  .update({
                    email: e.new_email,
                    is_active:
                      e.is_active === null ? loginRecord.is_active : e.is_active
                  })
                  .transacting(trx)
              : null;

          queries.push(query, login);
        });
        return Promise.all(queries);
      })
      .then(() => {
        if (
          current_email &&
          primaryEmail !== current_email &&
          email_is_primary
        ) {
          // make previous primary email not primary so current email can become primary
          return trx('email')
            .where({ account_id: req.params.id, email: primaryEmail })
            .update({ is_primary: false });
        }
        return;
      })
      .then(() => {
        if (current_email) {
          return trx('email')
            .where({ account_id: req.params.id, email: current_email })
            .update(emailUpdates)
            .then(success => {
              if (!success) {
                throw new Error('current_email not found');
              }
              return;
            });
        }
        return;
      })
      .then(() => {
        if (current_email) {
          //only update login if the current_email is the login email
          return trx('login')
            .where('email', current_email)
            .update(loginUpdates)
            .returning('is_active')
            .then(active => {});
        }
        return;
      })
      .then(() => {
        if (!password) return;
        return trx('login')
          .where('account_id', req.params.id)
          .update({ hash, updated_at: now });
      })
      .then(primaryPhoneRaw => {
        if (!primaryPhoneRaw && new_phone) {
          // just add new_phone if there is no primary phone, but new_phone was submitted
          return trx('phone')
            .insert({
              account_id: req.params.id,
              phone: new_phone,
              phone_raw: new_phone_raw,
              is_primary: true,
              ...(phone_type ? { phone_type } : {}),
              ...(phone_country ? { phone_country } : {})
            })
            .then(() => {
              return;
            });
        }
        if (
          primaryPhoneRaw &&
          current_phone_raw &&
          primaryPhoneRaw !== current_phone_raw &&
          phone_is_primary
        ) {
          // make previous primary phone not primary so current phone can become primary
          return trx('phone')
            .where({
              account_id: req.params.id,
              phone_raw: primaryPhoneRaw
            })
            .update({ is_primary: false });
        }
        return;
      })
      .then(() => {
        if (current_phone) {
          return trx('phone')
            .where({
              account_id: req.params.id,
              phone_raw: current_phone_raw
            })
            .update(phoneUpdates)
            .then(success => {
              if (!success) {
                throw new Error('current_phone not found');
              }
              return;
            });
        }
        return;
      })
      .then(() => {
        return trx('account_history').insert({
          account_id: req.params.id,
          author: req.account.account_id,
          action: 'UPDATE',
          transaction: {
            ...accountUpdates,
            ...(current_email ? { current_email } : {}),
            ...(new_email ? { new_email } : {}),
            ...(email_is_primary || email_is_primary === false
              ? { email_is_primary }
              : {}),
            ...(current_phone ? { current_phone } : {}),
            ...(new_phone ? { new_phone } : {}),
            ...(current_phone_raw ? { current_phone_raw } : {}),
            ...(new_phone_raw ? { new_phone_raw } : {}),
            ...(phone_is_primary || phone_is_primary === false
              ? { phone_is_primary }
              : {}),
            ...(phone_type ? { phone_type } : {}),
            ...(phone_country ? { phone_country } : {}),
            ...(is_active || is_active === false ? { is_active } : {})
          }
        });
      })
      .then(() => {
        return res.send(`account #${req.params.id} updated successfully.`);
      })
      .then(trx.commit)
      .catch(err => {
        trx.rollback;
        throw err;
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
      res.status(503).send('Failed to update account. ' + err);
    }
  });
};
