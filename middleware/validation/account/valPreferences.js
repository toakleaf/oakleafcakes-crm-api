const Joi = require('joi');

module.exports = (req, res, next) => {
  const {
    successMessageDuration,
    errorMessageDuration,
    showLoadingOverlays,
    showNotifications
  } = req.body;

  const schema = Joi.object().keys({
    successMessageDuration: Joi.number()
      .integer()
      .min(0)
      .max(15000)
      .allow(null)
      .optional(),
    errorMessageDuration: Joi.number()
      .integer()
      .min(0)
      .max(15000)
      .allow(null)
      .optional(),
    showLoadingOverlays: Joi.boolean()
      .allow(null)
      .optional(),
    showNotifications: Joi.boolean()
      .allow(null)
      .optional()
  });
  const { error } = Joi.validate(
    {
      successMessageDuration,
      errorMessageDuration,
      showLoadingOverlays,
      showNotifications
    },
    schema
  );
  if (error) return res.status(400).send(error.details[0].message);

  next();
};
