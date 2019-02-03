//Current account can delete their own user account. Admins can delete anyone.

module.exports = (req, res, db) => {
  if (
    req.params.id !== req.account.account_id &&
    req.account.role !== 'ADMIN'
  ) {
    return res.status(403).send('Access denied.');
  }
  db('account')
    .where('id', req.params.id)
    .del()
    .then(success => {
      if (!success) throw new Error('account not found.');
      res.header('X-Deleted-account', req.params.id).send('success');
    })
    .catch(err => res.status(503).send('Failed to delete account. ' + err));
};
