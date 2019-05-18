//take a snapshot of state prior to every request that will alter it.
module.exports = async (
  req,
  db,
  account_id,
  author_id,
  action,
  status = 'SUCCESS'
) => {
  try {
    // IMPORTANT!!! Don't let password get saved to plain text.
    delete req.body.password;

    const account = await db('account')
      .select(
        'account.id',
        'account.first_name',
        'account.last_name',
        'account.company_name',
        'account.created_at',
        'account.updated_at',
        'account_role.role'
      )
      .where('id', account_id)
      .leftJoin('account_role', 'account.id', 'account_role.account_id')
      .then(data => data[0]);
    const author = await db('account')
      .select('id', 'first_name', 'last_name')
      .where('id', author_id)
      .then(data => data[0]);
    const emails = await db('email')
      .select('*')
      .where('account_id', account_id);
    const phones = await db('phone')
      .select('*')
      .where('account_id', account_id);
    const logins = await db('login')
      .select('id', 'email', 'is_active', 'created_at', 'updated_at')
      .where('account_id', account_id);

    const state = {
      ...account,
      emails,
      phones,
      logins,
      is_active: logins.some(l => l.is_active)
    };
    return new Promise((resolve, reject) => {
      db('account_history')
        .insert({
          account_id,
          author_id,
          ...(author
            ? { author_name: author.first_name + ' ' + author.last_name }
            : {}),
          action,
          status,
          request: req.body,
          state
        })
        .then(() => {
          return resolve(state);
        });
    });
  } catch (err) {
    console.error(err);
    throw new Error(err);
  }
};
