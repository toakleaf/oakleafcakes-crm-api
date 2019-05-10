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
  if (field && field === 'email') field = 'email.email'; //both login and email tables have email column
  if (field2 && field2 === 'email') field2 = 'email.email'; //both login and email tables have email column
  try {
    const accounts = await db('account')
      .select({
        id: 'account.id',
        first_name: 'account.first_name',
        last_name: 'account.last_name',
        company_name: 'account.company_name',
        created_at: 'account.created_at',
        updated_at: 'account.updated_at',
        role: 'account_role.role',
        // returns 2 results if account has both active and inactive logins
        is_active: 'login.is_active',
        // return multiple results if field being queried has multiple results.
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
      .leftJoin('account_role', 'account.id', 'account_role.account_id')
      .leftJoin('email', 'email.account_id', 'account.id')
      .leftJoin('phone', 'account.id', 'phone.account_id')
      .leftJoin('login', 'account.id', 'login.account_id')
      .where(qb => {
        if (active && inactive) {
          return; //default to return all
        }
        if (active) {
          return qb.where({ 'login.is_active': true });
        }
        if (inactive) {
          return qb.where({ 'login.is_active': false });
        }
      })
      .andWhere(qb => {
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

    const output = [];

    for (let i = 0; i < accounts.length; i++) {
      const additions = {};
      await db('email')
        .select('*')
        .where('account_id', accounts[i].id)
        .orderBy([
          //primary email will come first, followed by most recently updated, followed by alphabetical
          { column: 'is_primary', order: 'desc' },
          { column: 'updated_at', order: 'desc' },
          { column: 'email', order: 'asc' }
        ])
        .then(data => (additions.emails = data));
      await db('phone')
        .select('*')
        .where('account_id', accounts[i].id)
        .orderBy([
          //primary phone will come first, followed by most recently updated
          { column: 'is_primary', order: 'desc' },
          { column: 'updated_at', order: 'desc' }
        ])
        .then(data => (additions.phones = data));

      output.push({
        result: i,
        ...accounts[i],
        ...additions
      });
    }
    // console.log(output);
    res.json(output);
  } catch (err) {
    console.error(err);
    return res.status(401).send('search failed');
  }
};
