const Joi = require('joi');

module.exports = (req, res, next) => {
  const schema = Joi.object().keys({
    orderby: Joi.valid([
      'id',
      'email',
      'first_name',
      'last_name',
      'company_name',
      'created_at',
      'updated_at',
      'role'
    ]),
    order: Joi.valid(['asc', 'desc']),
    count: Joi.number()
      .integer()
      .min(1)
      .max(100),
    page: Joi.number()
      .integer()
      .positive(),
    role: Joi.string().uppercase(),
    field: Joi.valid([
      'id',
      'email',
      'first_name',
      'last_name',
      'company_name',
      'phone'
    ]),
    query: Joi.string().lowercase()
  });

  const { orderby, order, count, page, role, field, query } = req.query;
  const toValidate = {
    ...(orderby ? { orderby: orderby.toLowerCase() } : {}),
    ...(order ? { order: order.toLowerCase() } : {}),
    ...(count ? { count: parseInt(count) } : {}),
    ...(page ? { page: parseInt(page) } : {}),
    ...(role ? { role: role.toUpperCase() } : {}),
    ...(field ? { field: field.toLowerCase() } : {}),
    ...(query ? { query: query.toLowerCase() } : {})
  };
  const { error, value } = Joi.validate(toValidate, schema);

  req.query.orderby = req.query.orderby
    ? req.query.orderby.toLowerCase()
    : null;
  req.query.order = req.query.order ? req.query.order.toLowerCase() : null;
  req.query.count = req.query.count ? parseInt(req.query.count) : null;
  req.query.page = req.query.page ? parseInt(req.query.page) : null;
  req.query.role = req.query.role ? req.query.role.toUpperCase() : null;
  req.query.field = req.query.field ? req.query.field.toLowerCase() : null;
  req.query.query = req.query.query ? req.query.query.toLowerCase() : null;

  if (error)
    return res
      .status(400)
      .send(`Query string invalid: ${error.details[0].message}`);
  next();
};
