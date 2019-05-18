module.exports = (req, res, db, snapshot) => {
  db.transaction(trx => {
    trx('account')
      .where('id', req.params.id)
      .del()
      .then(() => {
        return snapshot(
          req,
          db,
          req.params.id,
          req.account.account_id,
          'DELETE'
        );
      })
      .then(() => {
        trx.commit();
        return res.header('x-deleted-account', req.params.id).send('success');
      })
      .catch(err => {
        console.error(err);
        trx.rollback();
        res.status(503).send('Failed to delete account. ' + err);
      });
  });
};
