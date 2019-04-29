const Joi = require('joi');
const { MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH } = require('../../../config');

module.exports = (req, res, next) => {
  const schema = Joi.object().keys({
    email: Joi.string().email({ minDomainAtoms: 2 }),
    password: Joi.string()
      .min(MIN_PASSWORD_LENGTH)
      .max(MAX_PASSWORD_LENGTH),
    role: Joi.valid(['CUSTOMER', 'ADMIN', 'EMPLOYEE']),
    first_name: Joi.string().max(100),
    last_name: Joi.string().max(100),
    company_name: Joi.string().max(100),
    phone: Joi.string().max(20),
    phone_type: Joi.string().max(20),
    phone_country: Joi.string()
      .uppercase()
      .length(2)
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
      phone_type: req.body.phone_type,
      phone_country: req.body.phone_country
    },
    schema
  );
  if (error) return res.status(400).send(error.details[0].message);

  //email can be entered any-case, but always saved lowercase
  req.body.email = req.body.email ? req.body.email.toLowerCase() : null;
  //role can be entered any-case, but always saved uppercase
  if (req.body.role) req.body.role = req.body.role.toUpperCase();
  else req.body.role = 'CUSTOMER';
  //phone_type can be entered any-case, but always saved lowercase
  if (req.body.phone_type)
    req.body.phone_type = req.body.phone_type.toLowerCase();
  if (req.body.role === 'ADMIN' || req.body.role === 'EMPLOYEE') {
    return res.status(403).send('Not authorized to create this account role');
  }
  next();
};
