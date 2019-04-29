const Joi = require('joi');
const db = require('../../../db/db');

module.exports = (req, res, next) => {
  const schema = Joi.object().keys({
    email: Joi.string()
      .email({ minDomainAtoms: 2 })
      .required(),
    lock: Joi.boolean()
      .allow(null)
      .optional()
  });

  //email can be entered any-case, but always saved lowercase
  req.body.email = req.body.email.toLowerCase();

  const { error } = Joi.validate(
    {
      email: req.body.email,
      ...(req.body.lock ? { lock: req.body.lock } : {})
    },
    schema
  );
  if (error) {
    return res.status(400).send(error.details[0].message);
  }

  if (req.account.role === 'ADMIN') {
    //Admins can update anyone.
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
      });
  }
};
