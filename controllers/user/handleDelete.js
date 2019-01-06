//Current user can delete their own user account. Admins can delete anyone.

const handleDelete = (req, res, db) => {
  if (req.params.id !== req.user.user_id && !req.user.is_admin) {
    return res.status(403).send('Access denied.');
  }
  db('user')
    .where('id', req.params.id)
    .del()
    .then(success => {
      if (!success) throw new Error('User not found.');
      res.header('X-Deleted-User', req.params.id).send('success');
    })
    .catch(err => res.status(503).send('Failed to delete user. ' + err));
};

module.exports = handleDelete;
