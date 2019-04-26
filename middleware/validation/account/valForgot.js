const Joi = require('joi');

module.exports = (req, res, next) => {
  const schema = Joi.object().keys({
    email: Joi.string()
      .email({ minDomainAtoms: 2 })
      .required(),
    lock: Joi.boolean()
      .allow(null)
      .optional()
  });
  const { error } = Joi.validate(
    {
      email: req.body.email,
      ...(req.body.lock ? { lock: req.body.lock } : {})
    },
    schema
  );
  if (error) {
    console.error(error);
    return res.status(400).send(error.details[0].message);
  }

  //email can be entered any-case, but always saved lowercase
  req.body.email = req.body.email.toLowerCase();

  next();
};
