module.exports = async (req, res, db, bcrypt, config) => {
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

  const updateLogin = emails ? emails.filter(e => e.is_login === true) : null;

  //only allow updating of one login at a time
  if (updateLogin && updateLogin.length > 1)
    return res
      .status(503)
      .send('Failed to update account. Can only change 1 login at a time.');

  const loginRecord =
    updateLogin && updateLogin.length > 0
      ? await db('login')
          .select('*')
          .where({
            account_id: req.params.id,
            ...(updateLogin[0].current_email
              ? { email: updateLogin[0].current_email }
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
    .then(primary_email => primary_email);

  const existingPhones = phones
    ? await db('phone')
        .select('*')
        .where({ account_id: req.params.id })
        .then(p => p)
    : null;

  const existingPhonesRaw = existingPhones
    ? existingPhones.map(p => p.phone_raw)
    : null;
  const updatePrimaryPhone = phones
    ? phones.filter(p => p.is_primary === true)
    : null;
  const primaryPhone = existingPhones
    ? existingPhones.filter(p => p.is_primary === true)
    : null;

  const hash = password
    ? await bcrypt.hash(password, config.BCRYPT_COST_FACTOR)
    : null;

  // MAKE VALIDATION ENSURING ONLY 1 PRIMARY EMAIL OR PHONE PER REQ

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
        console.log(primaryEmail);
        console.log(updatePrimaryEmail);
        //if e.is_primary, first reset ALL of account's emails to is_primary = false
        if (
          !primaryEmail ||
          !updatePrimaryEmail ||
          !primaryEmail.length ||
          !updatePrimaryEmail.length ||
          updatePrimaryEmail[0].email === primaryEmail[0].email
        )
          return;
        return trx('email')
          .where({ account_id: req.params.id, is_primary: true })
          .update({ is_primary: false });
      })
      .then(() => {
        //if e.is_primary, first reset ALL of account's emails to is_primary = false
        if (
          !primaryPhone ||
          !updatePrimaryPhone ||
          !primaryPhone.length ||
          !updatePrimaryPhone.length ||
          updatePrimaryPhone[0].phone_raw === primaryPhone[0].phone_raw
        )
          return;
        return trx('phone')
          .where({ account_id: req.params.id, is_primary: true })
          .update({ is_primary: false });
      })
      .then(() => {
        // if a global is_active is set to false, make all logins inactive. Otherwise do it email by email below.
        if (is_active === false)
          return trx('login')
            .where({ account_id: req.params.id, is_active: true })
            .update({ is_active: false });
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
              : {})
          };
          const queryEmail = e.current_email
            ? db('email')
                .where({ account_id: req.params.id, email: e.current_email })
                .update({ ...update, updated_at: now })
                .transacting(trx)
            : db('email')
                .insert({ ...update, account_id: req.params.id })
                .transacting(trx);
          //only update login if is_login flag.
          const queryLogin =
            loginRecord && e.is_login
              ? db('login')
                  .where({ id: loginRecord.id })
                  .update({
                    ...(e.new_email ? { email: e.new_email } : {}),
                    updated_at: now,
                    ...(e.is_active ? { is_active: e.is_active } : {}),
                    ...(password ? { hash } : {})
                  })
                  .transacting(trx)
              : null;
          queries.push(queryEmail, queryLogin);
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
            ...(!(primaryPhone.length && updatePrimaryPhone.length)
              ? { is_primary: true }
              : {})
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
