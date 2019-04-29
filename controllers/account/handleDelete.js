module.exports = (req, res, db) => {
  db.transaction(trx => {
    trx('account')
      .where('id', req.params.id)
      .del()
      .then(() => {
        return trx('account_history').insert({
          account_id: req.params.id,
          author: req.account.account_id,
          action: 'DELETE'
        });
      })
      .then(() => {
        res.header('x-deleted-account', req.params.id).send('success');
      })
      .then(trx.commit)
      .catch(err => {
        trx.rollback;
        res.status(503).send('Failed to delete account. ' + err);
      });
  });
};
