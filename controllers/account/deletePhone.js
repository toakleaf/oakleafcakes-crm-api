module.exports = (req, res, db, snapshot) => {
  if (req.body.phones.length) {
    for (let i = 0; i < req.body.phones.length; i++) {
      req.body.phones[i].phone_raw = req.body.phones[i].phone
        ? req.body.phones[i].phone.replace(/[^0-9]/g, '')
        : null;
    }
  }

  let deletedPrimary = null;

  db.transaction(trx => {
    trx('phone')
      .select('*')
      .where({ account_id: req.params.id, is_primary: true })
      .then(primary => {
        deletedPrimary = primary.length ? true : false;
        const queries = [];

        req.body.phones.forEach(p => {
          const deletePhone = db('phone')
            .where({ account_id: req.params.id, phone_raw: p.phone_raw })
            .del()
            .transacting(trx);

          queries.push(deletePhone);
        });
        return Promise.all(queries);
      })
      .then(() => {
        if (deletedPrimary) {
          return trx('phone')
            .first('id')
            .where({ account_id: req.params.id })
            .orderBy('id', 'desc')
            .then(id => {
              if (!id) return; //if no more phones
              return trx('phone')
                .where('id', id.id)
                .update('is_primary', true);
            });
        }
      })
      .then(() => {
        return snapshot(
          req,
          db,
          req.params.id,
          req.account.account_id,
          'DELETE'
        );
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
