module.exports = async (req, res, db) => {
  let {
    orderby,
    order,
    count,
    page,
    role,
    field,
    query,
    field2,
    query2,
    exact,
    active,
    inactive
  } = req.query;
  let offset = page * count - count;
  let phone_raw =
    query && field === 'phone' ? query.replace(/[^0-9]/g, '') : null;
  let phone_raw2 =
    query2 && field2 === 'phone' ? query2.replace(/[^0-9]/g, '') : null;
  const groupByArgs = ['account.id', 'account_role.role'];
  if (field && field === 'email') {
    groupByArgs.push('email.email');
    field = 'email.email'; //both login and email tables have email column
  }
  if (field2 && field2 === 'email') {
    groupByArgs.push('email.email');
    field2 = 'email.email'; //both login and email tables have email column
  }
  if (field === 'phone' || field2 === 'phone') {
    groupByArgs.push(
      'phone.phone',
      'phone.phone_raw',
      'phone.phone_country',
      'phone.phone_type'
    );
  }
  let status = '';
  if (active) status = 'bool_or(login.is_active) = true';
  if (inactive) status = 'bool_or(login.is_active) = false';
  if (active && inactive) status = '';

  try {
    const accounts = await db('account')
      .leftJoin('account_role', 'account.id', 'account_role.account_id')
      .leftJoin('email', 'email.account_id', 'account.id')
      .leftJoin('phone', 'account.id', 'phone.account_id')
      .leftJoin('login', 'account.id', 'login.account_id')
      .select({
        id: 'account.id',
        first_name: 'account.first_name',
        last_name: 'account.last_name',
        company_name: 'account.company_name',
        created_at: 'account.created_at',
        updated_at: 'account.updated_at',
        role: 'account_role.role',
        emails: db.raw(
          "ARRAY_AGG(distinct(jsonb_build_object('is_primary', email.is_primary, 'id', email.id, 'email', email.email, 'created_at', email.created_at, 'updated_at', email.updated_at)))"
        ),
        phones: db.raw(
          "ARRAY_AGG(distinct(jsonb_build_object('is_primary', phone.is_primary, 'id', phone.id, 'phone', phone.phone, 'phone_raw', phone.phone_raw, 'phone_country', phone.phone_country, 'phone_type', phone.phone_type, 'created_at', phone.created_at, 'updated_at', phone.updated_at)))"
        ),
        logins: db.raw(
          "ARRAY_AGG(distinct(jsonb_build_object('is_active', login.is_active, 'id', login.id, 'email', login.email, 'created_at', login.created_at, 'updated_at', login.updated_at)))"
        ),
        is_active: db.raw('bool_or(login.is_active)'),
        // return multiple results (duplicate accounts) if field being queried has multiple results.
        ...(field === 'email.email' || field2 === 'email.email'
          ? { email: 'email.email' }
          : {}),
        ...(field === 'phone' || field2 === 'phone'
          ? {
              phone: 'phone.phone',
              phone_raw: 'phone.phone_raw',
              phone_country: 'phone.phone_country',
              phone_type: 'phone.phone_type'
            }
          : {})
      })
      .groupBy(groupByArgs)
      .havingRaw(status)
      .where(qb => {
        if (role) {
          if (Array.isArray(role)) {
            return qb.whereIn('account_role.role', role);
          }
          return qb.where('account_role.role', role);
        }
      })
      .andWhere(qb => {
        if (field && query) {
          if (field === 'id') qb.where('id', parseInt(query));
          if (exact) {
            if (field === 'phone') qb.where('phone.phone_raw', '=', phone_raw);
            else qb.where(field, '=', query);
          }
          if (field === 'phone')
            qb.where('phone.phone_raw', 'ilike', `%${phone_raw}%`);
          else qb.where(field, 'ilike', `%${query}%`);

          if (field2 && query2) {
            if (field2 === 'id') qb.orWhere('id', parseInt(query2));
            if (exact) {
              if (field2 === 'phone')
                qb.orWhere('phone.phone_raw', '=', phone_raw2);
              else qb.where(field2, '=', query2);
            }
            if (field2 === 'phone')
              qb.orWhere('phone.phone_raw', 'ilike', `%${phone_raw2}%`);
            else qb.orWhere(field2, 'ilike', `%${query2}%`);
          }
          return qb;
        }
      })
      .distinct()
      .orderBy(orderby ? orderby : 'id', order ? order : 'asc')
      .limit(count ? count : 100) //limit to 100 by default
      .offset(offset > 0 ? offset : 0)
      .then(data => data);

    //remove null value if no email or phone
    if (accounts.length && accounts[0].emails.length === 1) {
      accounts[0].emails = accounts[0].emails.filter(a => a.id);
    }
    if (accounts.length && accounts[0].phones.length === 1) {
      accounts[0].phones = accounts[0].phones.filter(a => a.id);
    }

    // console.log(accounts[0].emails);
    res.json(accounts);
  } catch (err) {
    console.error(err);
    return res.status(401).send('search failed');
  }
};
