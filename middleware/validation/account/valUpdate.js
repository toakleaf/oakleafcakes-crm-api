const Joi = require('joi');
const db = require('../../../db/db');
const { MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH } = require('../../../config');

module.exports = (req, res, next) => {
  if (
    !req.body.new_email &&
    !req.body.current_email &&
    !req.body.password &&
    !req.body.role &&
    !req.body.first_name &&
    !req.body.last_name &&
    !req.body.company_name &&
    !req.body.new_phone &&
    !req.body.current_phone &&
    !req.body.phone_type &&
    !req.body.phone_country
  ) {
    return res.status(400).send('No update request information given.');
  }

  const schema = Joi.object().keys({
    new_email: Joi.string()
      .email({ minDomainAtoms: 2 })
      .allow(null)
      .optional(),
    current_email: Joi.string()
      .email({ minDomainAtoms: 2 })
      .allow(null)
      .optional(),
    email_is_primary: Joi.boolean(),
    password: Joi.string()
      .min(MIN_PASSWORD_LENGTH)
      .max(MAX_PASSWORD_LENGTH)
      .allow(null)
      .optional(),
    role: Joi.valid(['ADMIN', 'EMPLOYEE', 'CUSTOMER'])
      .allow(null)
      .optional(),
    first_name: Joi.string()
      .max(100)
      .allow(null)
      .allow('')
      .optional(),
    last_name: Joi.string()
      .max(100)
      .allow(null)
      .allow('')
      .optional(),
    company_name: Joi.string()
      .max(100)
      .allow(null)
      .allow('')
      .optional(),
    new_phone: Joi.string()
      .max(20)
      .allow(null)
      .optional(),
    current_phone: Joi.string()
      .max(20)
      .allow(null)
      .optional(),
    phone_type: Joi.string()
      .max(20)
      .allow(null)
      .optional(),
    phone_country: Joi.string()
      .uppercase()
      .length(2)
      .allow(null)
      .optional(),
    phone_is_primary: Joi.boolean()
      .allow(null)
      .optional(),
    is_active: Joi.boolean()
      .allow(null)
      .optional(),
    id: Joi.number()
      .integer()
      .positive()
  });

  console.log(req.body.company_name ? 'is ok' : 'is null');

  //email can be entered any-case, but always saved lowercase
  if (req.body.email) req.body.email = req.body.email.toLowerCase();
  //email can be entered any-case, but always saved uppercase
  if (req.body.role) req.body.role = req.body.role.toUpperCase();
  //email can be entered any-case, but always saved lowercase
  if (req.body.phone_type)
    req.body.phone_type = req.body.phone_type.toLowerCase();

  const { error } = Joi.validate(
    {
      new_email: req.body.new_email,
      current_email: req.body.current_email,
      email_is_primary: req.body.email_is_primary,
      password: req.body.password,
      role: req.body.role,
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      company_name: req.body.company_name,
      new_phone: req.body.new_phone,
      current_phone: req.body.current_phone,
      phone_type: req.body.phone_type,
      phone_country: req.body.phone_country,
      phone_is_primary: req.body.phone_is_primary,
      is_active: req.body.is_active,
      id: req.params.id
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
      });
  }
};
