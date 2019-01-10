const nodemailer = require('nodemailer');
const { GMAIL } = require('../../config');

const transport = {
  service: 'gmail',
  auth: {
    type: 'OAuth2',
    user: GMAIL.client_user,
    clientId: GMAIL.client_id,
    clientSecret: GMAIL.secret,
    refreshToken: GMAIL.refresh_token
  }
};

const transporter = nodemailer.createTransport(transport, {
  from: 'Oakleaf Cakes <orders@oakleafcakes.com>'
});

module.exports = (message, callback) => transporter.sendMail(message, callback);
