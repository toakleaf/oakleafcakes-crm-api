const Joi = require('joi');

module.exports = (req, res, next) => {
  const schema = Joi.object().keys({
    quantity: Joi.number()
      .integer()
      .positive()
      .required(),
    unit: Joi.valid([
      'w',
      'd',
      'day',
      'days',
      'h',
      'hr',
      'hour',
      'hours',
      'm',
      'min',
      'minute',
      'minutes',
      's',
      'sec',
      'second',
      'seconds'
    ]).required()
  });

  req.body.unit = req.body.unit ? req.body.unit.toLowerCase() : null;

  const { error } = Joi.validate(
    {
      quantity: req.body.quantity,
      unit: req.body.unit
    },
    schema
  );

  if (error) {
    console.error(error.details[0]);
    return res.status(400).send(error.details[0].message);
  }

  next();
};
