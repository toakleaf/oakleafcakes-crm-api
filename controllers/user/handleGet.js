module.exports = (req, res, db) => {
  db.select('*')
    .from('user')
    .where('id', '=', req.user.user_id)
    .then(data => {
      res.json(data[0]);
    })
    .catch(err => res.status(401).json('bad credentials'));
};
