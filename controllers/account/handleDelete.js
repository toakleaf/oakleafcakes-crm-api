module.exports = (req, res, db) => {
  db.transaction(trx => {
    trx('account')
      .where('id', req.params.id)
      .del()
      .then(() => {
        return saveHistorySnapshot(
          req,
          db,
          req.params.id,
          req.account.account_id,
          'DELETE'
        );

        // return trx('account_history').insert({
        //   account_id: req.params.id,
        //   author: req.account.account_id,
        //   action: 'DELETE'
        // });
      })
      .then(() => {
        trx.commit();
        return res.header('x-deleted-account', req.params.id).send('success');
      })
      .catch(err => {
        trx.rollback();
        res.status(503).send('Failed to delete account. ' + err);
      });
  });
};
