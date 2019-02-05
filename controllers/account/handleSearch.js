module.exports = (req, res, db) => {
  const { orderby, order, count, page, role, field, query } = req.query;
  const offset = page * count - count;
  db.select(
    'account.id',
    'account.first_name as first_name',
    'account.last_name as last_name',
    'account.company_name as company_name',
    'email.email as email',
    'email.is_primary as email_is_primary',
    'login_role.role',
    'phone.phone as phone',
    'phone.is_primary as phone_is_primary',
    'phone.phone_type',
    'account.created_at',
    'account.updated_at'
  )
    .from('account')
    .leftJoin('email', 'email.account_id', 'account.id')
    .leftJoin('login_role', 'account.id', 'login_role.account_id')
    .leftJoin('phone', 'account.id', 'phone.account_id')
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
      if (field) {
        return qb.where(field, 'ilike', `%${query ? query : ''}%`);
      }
    })
    .limit(count ? count : 100)
    .offset(offset > 0 ? offset : 0)
    .orderBy(orderby ? orderby : 'id', order ? order : 'asc')
    .then(data => {
      res.json(data);
    })
    .catch(err => res.status(401).json('bad credentials' + err));
};
