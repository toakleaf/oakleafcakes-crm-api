//Current user can delete their own user account. Admins can delete anyone.

const handleUpdate = (req, res, db, bcrypt) => {
  if (req.params.id !== req.user.user_id && !req.user.is_admin) {
    return res.status(403).send('Access denied.');
  }
  const {
    email,
    password,
    is_admin,
    first_name,
    last_name,
    display_name
  } = req.body;
  db('user')
    .where('id', req.params.id)
    .del()
    .then(success => {
      if (!success) throw new Error('User not found.');
      res.header('X-Deleted-User', req.params.id).send('success');
    })
    .catch(err => res.status(503).send('Failed to delete user. ' + err));
};

module.exports = handleUpdate;
