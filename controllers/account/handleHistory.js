module.exports = (req, res, db) => {
  const { orderby, order, count, page } = req.query;
  const offset = page * count - count;
  db.select('*')
    .from('account_history')
    .where('account_id', req.params.id)
    .limit(count ? count : 100)
    .offset(offset > 0 ? offset : 0)
    .orderBy(orderby ? orderby : 'created_at', order ? order : 'asc')
    .then(data => {
      res.json(data);
    })
    .catch(err => res.status(401).json('bad credentials' + err));
};
