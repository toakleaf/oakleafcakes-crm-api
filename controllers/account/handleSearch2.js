module.exports = (req, res, db) => {
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

  db.select(
    'account.id as id',
    'account.first_name as first_name',
    'account.last_name as last_name',
    'account.company_name as company_name',
    'email.email as email',
    'email.is_primary as email_is_primary',
    'account_role.role',
    'phone.phone as phone',
    'phone.phone_raw',
    'phone.is_primary as phone_is_primary',
    'phone.phone_type',
    'phone.phone_country',
    'account.created_at',
    'account.updated_at',
    'login.is_active'
  )
    .from('account')
    .leftJoin('account_role', 'account.id', 'account_role.account_id')
    .leftJoin('email', 'email.account_id', 'account.id')
    .leftJoin('phone', 'account.id', 'phone.account_id')
    .leftJoin('login', 'account.id', 'login.account_id')
    .where(qb => {
      if (field === 'email')
        //duplicate contacts ok if multiple emails
        return qb
          .whereNull('phone.is_primary')
          .orWhere({ 'phone.is_primary': true });
      if (field === 'phone')
        //duplicate contacts ok if multiple phones
        return qb
          .whereNull('email.is_primary')
          .orWhere({ 'email.is_primary': true });
      //return record if true/true or null/true or true/null
      return qb
        .whereNull('phone.is_primary', 'email.is_primary')
        .orWhere({ 'phone.is_primary': true, 'email.is_primary': true });
    })
    .andWhere(qb => {
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
    .orderBy(orderby ? orderby : 'id', order ? order : 'asc')
    .limit(count ? count : 100)
    .offset(offset > 0 ? offset : 0)
    .then(data => {
      res.json(data);
    })
    .catch(err => {
      console.log(err);
      return res.status(401).send('search failed');
    });
};
