const Joi = require('joi');

module.exports = function(req, res, next) {
  const schema = Joi.object().keys({
    orderby: Joi.valid([
      'id',
      'email',
      'first_name',
      'last_name',
      'display_name',
      'email',
      'created_at',
      'updated_at'
    ]),
    order: Joi.valid(['asc', 'desc']),
    count: Joi.number()
      .integer()
      .min(1)
      .max(100),
    page: Joi.number()
      .integer()
      .positive()
  });

  const { orderby, order, count, page } = req.query;
  const toValidate = {
    ...(orderby ? { orderby: orderby.toLowerCase() } : {}),
    ...(order ? { order: order.toLowerCase() } : {}),
    ...(count ? { count: parseInt(count) } : {}),
    ...(page ? { page: parseInt(page) } : {})
  };
  const { error, value } = Joi.validate(toValidate, schema);
  if (error)
    return res
      .status(400)
      .send(`Query string invalid: ${error.details[0].message}`);
  next();
};
