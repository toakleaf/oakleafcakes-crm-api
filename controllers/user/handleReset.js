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

    const hash = await bcrypt.hash(
      req.body.password,
      config.BCRYPT_COST_FACTOR
    );

    const data = await db('login')
      .where('id', req.params.id)
      .returning(['user_id', 'is_admin'])
      .update({
        hash: hash,
        reset_token_hash: null,
        updated_at: now
      });

    if (!data[0].user_id) throw new Error('failed to update login');

    const token = signToken(data[0].user_id, data[0].is_admin);
    return res.header('x-auth-token', token).json('success');
  } catch (err) {
    res.status(401).json('bad credentials ');
  }
};
