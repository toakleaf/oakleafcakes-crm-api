const Joi = require('joi');
const { MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH } = require('../../../config');

module.exports = (req, res, next) => {
  if (
    !req.body.email &&
    !req.body.password &&
    !req.body.role &&
    !req.body.first_name &&
    !req.body.last_name &&
    !req.body.company_name &&
    !req.body.phone &&
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
    phone_type: Joi.string().max(20)
  });
  const { error } = Joi.validate(
    {
      email: req.body.email,
      password: req.body.password,
      role: req.body.role,
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      company_name: req.body.company_name,
      phone: req.body.phone,
      phone_type: req.body.phone_type
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
    req.params.id === req.user.user_id ||
    req.user.role === 'ADMIN' ||
    (req.params.role !== 'ADMIN' &&
      req.params.role !== 'EMPLOYEE' &&
      req.user.role === 'EMPLOYEE')
  ) {
    //Current user can update their own user account. Admins can update anyone.
    //Employees can update non-admin and non-employee accounts
    next();
  } else return res.status(403).send('Not authorized to update this account.');
};
