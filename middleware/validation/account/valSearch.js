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
    roleArray: Joi.array().items(Joi.string().uppercase()),
    role: Joi.string().uppercase(),
    field: Joi.valid([
      'id',
      'email',
      'first_name',
      'last_name',
      'company_name',
      'phone'
    ]),
    query: Joi.string().lowercase(),
    exact: Joi.boolean(),
    active: Joi.boolean(),
    inactive: Joi.boolean()
  });
  req.query.orderby =
    req.query.orderby && req.query.orderby.toLowerCase() !== 'null'
      ? req.query.orderby.toLowerCase()
      : null;
  console.log('hi');
  req.query.order =
    req.query.order && req.query.order.toLowerCase() !== 'null'
      ? req.query.order.toLowerCase()
      : null;
  req.query.count =
    req.query.count && req.query.count.toLowerCase() !== 'null'
      ? parseInt(req.query.count)
      : null;
  req.query.page =
    req.query.page && req.query.page.toString().toLowerCase() !== 'null'
      ? parseInt(req.query.page)
      : null;
  req.query.field =
    req.query.field && req.query.field.toLowerCase() !== 'null'
      ? req.query.field.toLowerCase()
      : null;
  req.query.query =
    req.query.query && req.query.query.toLowerCase() !== 'null'
      ? req.query.query.toLowerCase()
      : null;
  req.query.exact =
    req.query.exact && req.query.query.toLowerCase() !== 'null'
      ? req.query.exact.toLowerCase() == 'true'
      : null;
  req.query.active =
    req.query.active && req.query.query.toLowerCase() !== 'null'
      ? req.query.active.toLowerCase() == 'true'
      : null;
  req.query.inactive =
    req.query.inactive && req.query.query.toLowerCase() !== 'null'
      ? req.query.inactive.toLowerCase() == 'true'
      : null;

  const {
    orderby,
    order,
    count,
    page,
    role,
    field,
    query,
    exact,
    active,
    inactive
  } = req.query;

  const toValidate = {
    ...(orderby ? { orderby: orderby.toLowerCase() } : {}),
    ...(order ? { order: order.toLowerCase() } : {}),
    ...(count ? { count: parseInt(count) } : {}),
    ...(page ? { page: parseInt(page) } : {}),
    ...(role && Array.isArray(role)
      ? { roleArray: role.map(x => x.toUpperCase()) }
      : {}),
    ...(role && !Array.isArray(role) ? { role: role.toUpperCase() } : {}),
    ...(field ? { field: field.toLowerCase() } : {}),
    ...(query ? { query: query.toLowerCase() } : {}),
    ...(exact || exact === false ? { exact } : {}),
    ...(active || active === false ? { active } : {}),
    ...(inactive || inactive === false ? { inactive } : {})
  };
  const { error, value } = Joi.validate(toValidate, schema);

  if (req.query.role) {
    if (Array.isArray(req.query.role))
      req.query.role = req.query.role.map(x => x.toUpperCase());
    else req.query.role = req.query.role.toUpperCase();
  }

  if (error)
    return res
      .status(400)
      .send(`Query string invalid: ${error.details[0].message}`);
  next();
};
