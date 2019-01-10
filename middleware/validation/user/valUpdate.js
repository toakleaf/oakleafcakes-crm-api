const Joi = require('joi');
const { MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH } = require('../../../config');

module.exports = (req, res, next) => {
  if (
    !req.body.email &&
    !req.body.password &&
    !req.body.is_admin &&
    !req.body.first_name &&
    !req.body.last_name &&
    !req.body.display_name
  ) {
    return res.status(400).send('No update request information given.');
  }

  const schema = Joi.object().keys({
    email: Joi.string().email({ minDomainAtoms: 2 }),
    password: Joi.string()
      .min(MIN_PASSWORD_LENGTH)
      .max(MAX_PASSWORD_LENGTH),
    is_admin: Joi.bool(),
    first_name: Joi.string().max(100),
    last_name: Joi.string().max(100),
    display_name: Joi.string().max(32)
  });
  const { error } = Joi.validate(
    {
      email: req.body.email,
      password: req.body.password,
      is_admin: req.body.is_admin,
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      display_name: req.body.display_name
    },
    schema
  );
  if (error) return res.status(400).send(error.details[0].message);

  //email can be entered any-case, but always saved lowercase
  if (req.body.email) req.body.email = req.body.email.toLowerCase();

  if (req.params.id !== req.user.user_id && !req.user.is_admin) {
    //Current user can update their own user account. Admins can update anyone.
    return res.status(403).send('Not authorized to update this account.');
  }

  if (!req.user.is_admin && req.body.is_admin) {
    return res.status(403).send('Only admins can create admin accounts');
  }
  next();
};
