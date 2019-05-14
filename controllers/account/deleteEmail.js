module.exports = (req, res, db) => {
  let deletedPrimary = null;

  db.transaction(trx => {
    trx('account_history')
      .insert({
        account_id: req.params.id,
        author: req.account.account_id,
        action: 'DELETE',
        transaction: req.body
      })
      .then(() => {
        return db('login')
          .select('email')
          .where({ account_id: req.params.id });
      })
      .then(logins => {
        const queries = [];

        req.body.emails.forEach(e => {
          const deleteEmail = db('email')
            .where({ account_id: req.params.id, email: e.email })
            .returning('*')
            .del()
            .transacting(trx)
            .then(data => {
              if (data[0].is_primary) {
                deletedPrimary = true;
              }
            });

          const deleteLogin =
            logins.length && logins.some(l => l.email === e.email)
              ? db('login')
                  .where({ account_id: req.params.id, email: e.email })
                  .del()
                  .transacting(trx)
              : null;

          queries.push(deleteEmail, deleteLogin);
        });
        return Promise.all(queries);
      })
      .then(() => {
        if (deletedPrimary) {
          return trx('email')
            .first('id')
            .where({ account_id: req.params.id })
            .orderBy('id', 'desc')
            .then(id => {
              if (!id) return; //if no more emails
              return trx('email')
                .where('id', id.id)
                .update('is_primary', true);
            });
        }
      })
      .then(() => {
        trx.commit();
        return res.send('success');
      })
      .catch(err => {
        trx.rollback();
        console.error(err);
        res.status(503).send('Failed to delete account. ' + err);
      });
  });
};
