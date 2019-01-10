module.exports = async (req, res, db, bcrypt, config) => {
  try {
    const login = await db
      .select('*')
      .from('login')
      .where('id', req.params.id)
      .then(data => data[0]);

    if (!login) throw new Error('invalid id');

    const expiration = new Date(login.reset_token_expiration);
    const now = new Date(Date.now());

    if (now > expiration) throw new Error('token expired');

    await bcrypt.compare(
      req.params.token,
      data[0].reset_token_hash,
      (err, isValid) => {
        if (!isValid) throw new Error('invalid token');
      }
    );

    db('login')
      .where('id', req.params.id)
      .update('hash');
  } catch (err) {
    res.status(401).json('bad credentials');
  }
};
