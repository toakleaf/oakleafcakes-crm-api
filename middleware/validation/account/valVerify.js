const Joi = require('joi');

module.exports = (req, res, next) => {
  const schema = Joi.object().keys({
    token: Joi.string().required(),
    id: Joi.number()
      .integer()
      .positive()
      .required()
  });
  const { error } = Joi.validate(
    {
      token: req.params.token,
      id: req.params.id
    },
    schema
  );

  if (error) return res.status(400).send(error.details[0].message);

  next();
};
