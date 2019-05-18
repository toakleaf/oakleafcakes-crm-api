module.exports = async (req, res, db) => {
  const {
    successMessageDuration,
    errorMessageDuration,
    showLoadingOverlays,
    showNotifications
  } = req.body;
  const preferences = await db('preferences')
    .select('*')
    .where('account_id', req.account.account_id)
    .then(data => data[0])
    .catch(err => res.status(401).json('bad credentials' + err));

  if (preferences) {
    return db('preferences')
      .update({
        preferences: {
          successMessageDuration,
          errorMessageDuration,
          showLoadingOverlays,
          showNotifications
        }
      })
      .where('account_id', req.account.account_id)
      .then(data => {
        res.json(data[0]);
      })
      .catch(err => res.status(401).json('bad credentials' + err));
  }
  return db('preferences')
    .returning('*')
    .insert({
      account_id: req.account.account_id,
      preferences: {
        successMessageDuration,
        errorMessageDuration,
        showLoadingOverlays,
        showNotifications
      }
    })
    .then(data => {
      res.json(data[0]);
    })
    .catch(err => res.status(401).json('bad credentials' + err));
};
