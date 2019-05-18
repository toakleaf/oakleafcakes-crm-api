module.exports = async (req, res, db) => {
  const {
    successMessageDuration,
    errorMessageDuration,
    showLoadingOverlays,
    showNotifications
  } = req.body;

  const preferences = db('preferences')
    .select('*')
    .where('account_id', req.params.id)
    .then(data => data[0])
    .catch(err => res.status(401).json('bad credentials' + err));

  if (preferences.id) {
    return db('preferences')
      .update({
        preferences: {
          successMessageDuration,
          errorMessageDuration,
          showLoadingOverlays,
          showNotifications
        }
      })
      .where('account_id', req.params.id)
      .then(data => {
        res.json(data[0]);
      })
      .catch(err => res.status(401).json('bad credentials' + err));
  }
  return db('preferences')
    .insert({
      account_id: req.params.id,
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
