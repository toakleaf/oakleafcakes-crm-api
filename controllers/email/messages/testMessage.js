const { TEST_EMAIL_RECIPIENT } = require('../../../config');

module.exports = {
  to: TEST_EMAIL_RECIPIENT,
  subject: 'test',
  // must use back-ticks or double quotes for breaks to work in plain text
  text: `test\ntest`
};
