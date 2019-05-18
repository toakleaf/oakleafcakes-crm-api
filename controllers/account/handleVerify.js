const updatePendingTransaction = require('./updatePendingTransaction');

module.exports = async (req, res, db, bcrypt, signToken, config, snapshot) => {
  try {
    const activation_hash = await db
      .select('*')
      .from('activation_hash')
      .where('account_id', req.params.id)
      .then(data => data[0]);

    if (!activation_hash) {
      throw new Error('invalid id');
    }

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
        action: 'UPDATE',
        status: 'PENDING'
      })
      .then(data => data[data.length ? data.length - 1 : 0]);

    if (lastTransaction && lastTransaction.status === 'PENDING') {
      //if account has edit since user claimed, edits made during
      //account claiming process will be ignored.  Otherwise will update account.

      try {
        await updatePendingTransaction(
          db,
          req.params.id,
          lastTransaction.request,
          snapshot
        );
      } catch (err) {
        console.error(err);
      }
    }

    //update is_active flag
    await db('login')
      .where('account_id', req.params.id)
      .update({ is_active: true });

    //delete activation_hash
    await db('activation_hash')
      .where('account_id', req.params.id)
      .del();

    const role = await db('account_role')
      .select('role')
      .where('account_id', req.params.id);

    const history = await snapshot(
      req,
      db,
      req.params.id,
      req.params.id,
      'UPDATE'
    );

    const token = signToken(req.params.id, role[0].role);
    return res.header('x-auth-token', token).json('success');
  } catch (err) {
    // console.error(err);
    res.status(401).json('bad credentials ' + err);
  }
};
