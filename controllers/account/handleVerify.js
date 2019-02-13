//currently just copy pasta from handle reset

module.exports = async (req, res, db, bcrypt, signToken, config) => {
  try {
    const activation_hash = await db
      .select('*')
      .from('activation_hash')
      .where('account_id', req.params.id)
      .then(data => data[0]);

    if (!login) {
      throw new Error('invalid id');
    }

    const now = new Date(Date.now());

    const isValid = await bcrypt.compare(
      req.params.token,
      activation_hash.hash
    );

    if (!isValid) throw new Error('bad credentials');

    //get history
    const lastTransaction = await db('account_history')
      .select('*')
      .where({
        account_id: req.params.id,
        action: 'UPDATE'
      })
      .then(data => data[data.length - 1]);

    if (lastTransaction.transaction.pending) {
      //update the account
      //delete pending flag
    }

    //delete activation_hash
    await db('activation_hash')
      .where('account_id', req.params.id)
      .del();

    // const data = await db('login')
    //   .where('id', req.params.id)
    //   .returning('account_id')
    //   .update({
    //     hash,
    //     reset_token_hash: '',
    //     updated_at: now,
    //     reset_token_expiration: now
    //   })
    //   .then(id => {
    //     return db('account_role')
    //       .where('account_id', id[0])
    //       .select(['role', 'account_id']);
    //   })
    //   .then(data => data[0]);

    // if (!data.account_id) throw new Error('failed to update login');

    const token = signToken(data.account_id, data.role);
    return res.header('x-auth-token', token).json('success');
  } catch (err) {
    res.status(401).json('bad credentials ');
  }
};
