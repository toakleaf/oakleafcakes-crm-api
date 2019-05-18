module.exports = (req, res, db) => {
  db('preferences')
    .select('*')
    .where('account_id', req.account.account_id)
    .then(data => {
      res.json(data[0]);
    })
    .catch(err => res.status(401).json('bad credentials' + err));
};
