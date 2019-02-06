module.exports = async (req, res, db, bcrypt, signToken, config) => {
  try {
    const login = await db
      .select('*')
      .from('login')
      .where('id', req.params.id)
      .then(data => data[0]);

    if (!login) {
      throw new Error('invalid id');
    }

    const expiration = new Date(login.reset_token_expiration);
    const now = new Date(Date.now());
    if (now > expiration) throw new Error('token expired');

    const isValid = await bcrypt.compare(
      req.params.token,
      login.reset_token_hash
    );

    if (!isValid) throw new Error('bad credentials');

    const hash = await bcrypt.hash(
      req.body.password,
      config.BCRYPT_COST_FACTOR
    );

    const data = await db('login')
      .where('id', req.params.id)
      .returning('account_id')
      .update({
        hash,
        reset_token_hash: '',
        updated_at: now,
        reset_token_expiration: now
      })
      .then(id => {
        return db('account_role')
          .where('account_id', id[0])
          .select(['role', 'account_id']);
      })
      .then(data => data[0]);

    if (!data.account_id) throw new Error('failed to update login');

    const token = signToken(data.account_id, data.role);
    return res.header('x-auth-token', token).json('success');
  } catch (err) {
    res.status(401).json('bad credentials ');
  }
};
