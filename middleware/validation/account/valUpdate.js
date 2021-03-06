const Joi = require('joi');
const db = require('../../../db/db');
const { MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH } = require('../../../config');

module.exports = (req, res, next) => {
  if (
    !req.body.emails &&
    !req.body.password &&
    !req.body.role &&
    !req.body.first_name &&
    !req.body.last_name &&
    !req.body.company_name &&
    !req.body.phones
  ) {
    return res.status(400).send('No update request information given.');
  }
  const schema = Joi.object().keys({
    id: Joi.number()
      .integer()
      .positive()
      .required(),
    emails: Joi.array()
      .items(
        Joi.object().keys({
          new_email: Joi.string()
            .email({ minDomainAtoms: 2 })
            .allow(null)
            .optional(),
          current_email: Joi.string()
            .email({ minDomainAtoms: 2 })
            .allow(null)
            .optional(),
          is_primary: Joi.boolean()
            .allow(null)
            .optional(),
          is_active: Joi.boolean()
            .allow(null)
            .optional(),
          is_login: Joi.boolean()
            .allow(null)
            .optional()
        })
      )
      .allow(null)
      .optional(),
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
    phones: Joi.array()
      .items(
        Joi.object().keys({
          new_phone: Joi.string()
            .max(30)
            .allow(null)
            .optional(),
          current_phone: Joi.string()
            .max(30)
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
          is_primary: Joi.boolean()
            .allow(null)
            .optional()
        })
      )
      .allow(null)
      .optional(),
    is_active: Joi.boolean()
      .allow(null)
      .optional()
  });

  //email can be entered any-case, but always saved lowercase
  if (req.body.emails && Array.isArray(req.body.emails)) {
    for (let i = 0; i < req.body.emails.length; i++) {
      if (!req.body.emails[i].new_email && !req.body.emails[i].current_email)
        //every email object must have either new_email or current_email field
        return res
          .status(400)
          .send('Emails must contain new_email or current_email field');
      req.body.emails[i].new_email = req.body.emails[i].new_email
        ? req.body.emails[i].new_email.toLowerCase()
        : null;
      req.body.emails[i].current_email = req.body.emails[i].current_email
        ? req.body.emails[i].current_email.toLowerCase()
        : null;
    }
  }
  //role can be entered any-case, but always saved uppercase
  if (req.body.role) req.body.role = req.body.role.toUpperCase();
  //phone_type can be entered any-case, but always saved lowercase
  if (req.body.phones && Array.isArray(req.body.phones)) {
    for (let i = 0; i < req.body.phones.length; i++) {
      if (!req.body.phones[i].new_phone && !req.body.phones[i].current_phone)
        return res
          .status(400)
          .send('Phones must contain new_phone or current_phone field');
      req.body.phones[i].phone_type = req.body.phones[i].phone_type
        ? req.body.phones[i].phone_type.toLowerCase()
        : null;
    }
  }

  const { error } = Joi.validate(
    {
      id: req.params.id,
      emails: req.body.emails,
      password: req.body.password,
      role: req.body.role,
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      company_name: req.body.company_name,
      phones: req.body.phones,
      is_active: req.body.is_active
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
