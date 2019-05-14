const Joi = require('joi');
const db = require('../../../db/db');

module.exports = (req, res, next) => {
  const schema = Joi.object().keys({
    id: Joi.number()
      .integer()
      .positive()
      .required(),
    emails: Joi.array()
      .items(
        Joi.object().keys({
          email: Joi.string()
            .email({ minDomainAtoms: 2 })
            .required()
        })
      )
      .required()
  });

  const { error } = Joi.validate(
    {
      id: req.params.id,
      emails: req.body.emails
    },
    schema
  );
  if (error) {
    console.error(error);
    return res.status(400).send(error.details[0].message);
  }

  if (
    req.params.id === req.account.account_id ||
    req.account.role === 'ADMIN'
  ) {
    //Current account can update their own account account. Admins can update anyone.
    //Employees can update non-admin and non-employee accounts
    return next();
  } else {
    db('account_role')
      .where('account_id', req.params.id)
      .select('role')
      .then(role => {
        if (
          role[0].role &&
          req.account.role === 'EMPLOYEE' &&
          role[0].role !== 'ADMIN' &&
          role[0].role !== 'EMPLOYEE'
        ) {
          return next();
        } else
          return res.status(403).send('Not authorized to update this account.');
      })
      .catch(err => {
        console.error(err);
        res.status(503).send('Failed to update account. ' + err);
      });
  }
};
