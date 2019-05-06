module.exports = (req, res, db) => {
  db.select(
    'account.id',
    'account.first_name',
    'account.last_name',
    'account.company_name',
    'account.created_at',
    'account.updated_at',
    'email.email',
    'email.is_primary as email_is_primary',
    'account_role.role',
    'phone.phone',
    'phone.phone_raw',
    'phone.is_primary as phone_is_primary',
    'phone.phone_type',
    'phone.phone_country'
  )
    .from('account')
    .leftJoin('email', 'email.account_id', 'account.id')
    .leftJoin('account_role', 'account.id', 'account_role.account_id')
    .leftJoin('phone', 'account.id', 'phone.account_id')
    // .where(qb =>
    //   //return record if true/true or null/true or true/null
    //   qb
    //     .whereNull('phone.is_primary', 'email.is_primary')
    //     .orWhere({ 'phone.is_primary': true, 'email.is_primary': true })
    // )
    .where('account.id', req.account.account_id)
    .then(data => {
      res.json(data);
    })
    .catch(err => res.status(401).json('bad credentials' + err));
};
