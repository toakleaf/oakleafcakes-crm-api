module.exports = (req, res, db) => {
  db.select(
    'account.id',
    'account.first_name',
    'account.last_name',
    'account.company_name',
    'email.email',
    'email.is_primary as email_is_primary',
    'login_role.role',
    'phone.phone',
    'phone.is_primary as phone_is_primary',
    'phone.phone_type',
    'account.created_at',
    'account.updated_at'
  )
    .from('account')
    .leftJoin('email', 'email.account_id', 'account.id')
    .leftJoin('login_role', 'account.id', 'login_role.account_id')
    .leftJoin('phone', 'account.id', 'phone.account_id')
    .where(qb =>
      //return record if true/true or null/true or true/null
      qb
        .whereNull('phone.is_primary', 'email.is_primary')
        .orWhere({ 'phone.is_primary': true, 'email.is_primary': true })
    )
    .andWhere('account.id', req.account.account_id)
    .then(data => {
      res.json(data);
    })
    .catch(err => res.status(401).json('bad credentials' + err));
};
