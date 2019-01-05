const Joi = require('joi');

module.exports = function(req, res, next) {
  const schema = Joi.object().keys({
    email: Joi.string()
      .email({ minDomainAtoms: 2 })
      .required(),
    password: Joi.string()
      .min(10)
      .max(32)
      .required(),
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
  next();
};
