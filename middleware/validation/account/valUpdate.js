const Joi = require('joi');
const db = require('../../../db/db');
const { MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH } = require('../../../config');

module.exports = (req, res, next) => {
  if (
    !req.body.new_email &&
    !req.body.old_email &&
    !req.body.password &&
    !req.body.role &&
    !req.body.first_name &&
    !req.body.last_name &&
    !req.body.company_name &&
    !req.body.new_phone &&
    !req.body.old_phone &&
    !req.body.phone_type
  ) {
    return res.status(400).send('No update request information given.');
  }

  const schema = Joi.object().keys({
    email: Joi.string().email({ minDomainAtoms: 2 }),
    password: Joi.string()
      .min(MIN_PASSWORD_LENGTH)
      .max(MAX_PASSWORD_LENGTH),
    role: Joi.string().max(20),
    first_name: Joi.string().max(100),
    last_name: Joi.string().max(100),
    company_name: Joi.string().max(100),
    phone: Joi.string().max(20),
    phone_type: Joi.string().max(20),
    id: Joi.number().integer()
  });
  const { error } = Joi.validate(
    {
      email: req.body.new_email,
      email: req.body.old_email,
      password: req.body.password,
      role: req.body.role,
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      company_name: req.body.company_name,
      phone: req.body.new_phone,
      phone: req.body.old_phone,
      phone_type: req.body.phone_type,
      id: req.params.id
    },
    schema
  );
  if (error) return res.status(400).send(error.details[0].message);

  //email can be entered any-case, but always saved lowercase
  if (req.body.email) req.body.email = req.body.email.toLowerCase();
  //email can be entered any-case, but always saved uppercase
  if (req.body.role) req.body.role = req.body.role.toUpperCase();
  //email can be entered any-case, but always saved lowercase
  if (req.body.phone_type)
    req.body.phone_type = req.body.phone_type.toLowerCase();

  if (
    req.params.id === req.account.account_id ||
    req.account.role === 'ADMIN'
  ) {
    //Current account can update their own account account. Admins can update anyone.
    //Employees can update non-admin and non-employee accounts
    return next();
  } else {
    db('login_role')
      .where('login_id', req.params.id)
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
