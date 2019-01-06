module.exports = (req, res, db) => {
  const { orderby, order, count, page } = req.query;
  const offset = page * count - count;
  db.select('*')
    .from('user')
    .limit(count ? count : 100)
    .offset(offset > 0 ? offset : 0)
    .orderBy(orderby ? orderby : 'id', order ? order : 'asc')
    .then(data => {
      res.json(data);
    })
    .catch(err => res.status(401).json('bad credentials'));
};
