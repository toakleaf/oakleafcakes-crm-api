const Joi = require('joi');

module.exports = (req, res, next) => {
  const schema = Joi.object().keys({
    orderby: Joi.valid(['account_id', 'author', 'action', 'created_at']),
    order: Joi.valid(['asc', 'desc']),
    count: Joi.number()
      .integer()
      .min(1)
      .max(100),
    page: Joi.number()
      .integer()
      .positive(),
    id: Joi.number()
      .integer()
      .positive()
  });

  const { orderby, order, count, page } = req.query;
  const toValidate = {
    ...(orderby ? { orderby: orderby.toLowerCase() } : {}),
    ...(order ? { order: order.toLowerCase() } : {}),
    ...(count ? { count: parseInt(count) } : {}),
    ...(page ? { page: parseInt(page) } : {}),
    id: req.params.id
  };
  const { error, value } = Joi.validate(toValidate, schema);

  req.query.orderby = req.query.orderby
    ? req.query.orderby.toLowerCase()
    : null;
  req.query.order = req.query.order ? req.query.order.toLowerCase() : null;
  req.query.count = req.query.count ? parseInt(req.query.count) : null;
  req.query.page = req.query.page ? parseInt(req.query.page) : null;

  if (error)
    return res
      .status(400)
      .send(`Query string invalid: ${error.details[0].message}`);
  next();
};
