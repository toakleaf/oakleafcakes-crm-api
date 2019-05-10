module.exports = async (req, res, db) => {
  const id = req.params.id ? req.params.id : req.account.account_id;
  try {
    const account = await db
      .select(
        'account.id',
        'account.first_name',
        'account.last_name',
        'account.company_name',
        'account.created_at',
        'account.updated_at',
        'account_role.role'
      )
      .from('account')
      .where('id', id)
      .leftJoin('account_role', 'account.id', 'account_role.account_id')
      .then(data => data[0]);
    const emails = await db
      .select('*')
      .from('email')
      .where('account_id', account.id);
    const phones = await db
      .select('*')
      .from('phone')
      .where('account_id', account.id);
    const logins = await db
      .select('id', 'email', 'is_active')
      .from('login')
      .where('account_id', account.id);

    res.json({
      ...account,
      emails,
      phones,
      logins,
      is_active: logins.some(l => l.is_active)
    });
  } catch (err) {
    console.error(err);
    res.status(401).json('bad credentials' + err);
  }
};
