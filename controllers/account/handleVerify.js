const updatePendingTransaction = require('./updatePendingTransaction');

module.exports = async (req, res, db, bcrypt, signToken, config) => {
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
    // console.error('1: ' + req.params.token);
    // console.error('2: ' + activation_hash.hash);
    // console.error('3: ' + isValid);

    if (!isValid) throw new Error('bad credentials');

    //get history
    const lastTransaction = await db('account_history')
      .select('*')
      .where({
        account_id: req.params.id,
        action: 'UPDATE'
      })
      .then(data => data[data.length - 1]);

    if (lastTransaction && lastTransaction.transaction.pending) {
      console.error('here');
      //if account has edit since user claimed, edits made during
      //account claiming process will be ignored.  Otherwise will update account.
      const {
        first_name,
        last_name,
        company_name,
        email,
        phone,
        phone_type
      } = lastTransaction;

      const current_email = await db('email')
        .select('email')
        .where('account_id', req.params.id, 'is_primary', true);

      const current_phone = await db('phone')
        .select('phone')
        .where('account_id', req.params.id, 'is_primary', true);

      const updates = {
        ...(first_name ? { first_name } : {}),
        ...(last_name ? { last_name } : {}),
        ...(company_name ? { company_name } : {}),
        ...(email && email !== current_email
          ? { new_email: email, current_email, email_is_primary: true }
          : {}),
        ...(phone && phone !== current_phone
          ? { new_phone: phone, current_phone, phone_is_primary: true }
          : {}),
        ...(phone_type ? { phone_type } : {})
      };

      try {
        await updatePendingTransaction(db, id, updates);

        await db('account_history')
          .where('id', lastTransaction.transaction.id)
          .update({
            transaction: { ...lastTransaction.transaction, pending: false }
          });
      } catch (err) {
        console.error(err);
      }
    }

    //delete activation_hash
    await db('activation_hash')
      .where('account_id', req.params.id)
      .del();

    const role = await db('account_role')
      .select('role')
      .where('account_id', req.params.id);

    const token = signToken(req.params.id, role[0].role);
    return res.header('x-auth-token', token).json('success');
  } catch (err) {
    res.status(401).json('bad credentials ' + err);
  }
};
