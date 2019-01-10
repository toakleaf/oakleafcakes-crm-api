const Joi = require('joi');
const { MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH } = require('../../../config');

module.exports = (req, res, next) => {
  const schema = Joi.object().keys({
    password: Joi.string()
      .min(MIN_PASSWORD_LENGTH)
      .max(MAX_PASSWORD_LENGTH)
      .required(),
    id: Joi.number()
      .integer()
      .positive()
  });
  const { error } = Joi.validate(
    {
      password: req.body.password,
      id: req.params.id
    },
    schema
  );
  if (error) return res.status(400).send(error.details[0].message);

  next();
};
