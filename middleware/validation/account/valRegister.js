const Joi = require('joi');
const { MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH } = require('../../../config');

module.exports = (req, res, next) => {
  const schema = Joi.object().keys({
    email: Joi.string()
      .email({ minDomainAtoms: 2 })
      .allow(null)
      .optional(),
    password: Joi.string()
      .min(MIN_PASSWORD_LENGTH)
      .max(MAX_PASSWORD_LENGTH)
      .allow(null)
      .optional(),
    role: Joi.string()
      .max(100)
      .required(),
    first_name: Joi.string()
      .max(100)
      .allow(null)
      .optional(),
    last_name: Joi.string()
      .max(100)
      .allow(null)
      .optional(),
    company_name: Joi.string()
      .max(100)
      .allow(null)
      .optional(),
    phone: Joi.string()
      .max(20)
      .allow(null)
      .optional(),
    phone_type: Joi.string()
      .max(20)
      .allow(null)
      .optional(),
    phone_country: Joi.string()
      .max(20)
      .allow(null)
      .optional()
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
      ...(req.body.phone ? { phone_type: req.body.phone_type } : {}),
      ...(req.body.phone ? { phone_country: req.body.phone_country } : {})
    },
    schema
  );
  if (error) return res.status(400).send(error.details[0].message);

  //email can be entered any-case, but always saved lowercase
  if (req.body.email) req.body.email = req.body.email.toLowerCase();
  //role can be entered any-case, but always saved uppercase
  if (req.body.role) req.body.role = req.body.role.toUpperCase();
  //phone_type can be entered any-case, but always saved lowercase
  if (req.body.phone_type)
    req.body.phone_type = req.body.phone_type.toLowerCase();
  if (
    (req.body.role === 'ADMIN' || req.body.role === 'EMPLOYEE') &&
    (!req.account || req.account.role !== 'ADMIN')
  ) {
    return res.status(403).send('Not authorized to create this account role');
  }
  next();
};
