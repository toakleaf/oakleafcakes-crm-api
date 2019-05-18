module.exports = (req, res, db) => {
  db('preferences')
    .select('preferences')
    .where('account_id', req.params.id)
    .then(data => {
      res.json(data[0]);
    })
    .catch(err => res.status(401).json('bad credentials' + err));
};
