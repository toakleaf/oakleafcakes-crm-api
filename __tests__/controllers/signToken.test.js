const signToken = require('../../controllers/signToken');
const config = require('../../config');
const jwt = require('jsonwebtoken');

describe('signToken', () => {
  it('should return a valid token', () => {
    const token = signToken(1, true);
    const tokenPayload = jwt.verify(token, config.JWT_KEY);
    expect(tokenPayload).toHaveProperty('iat');
    expect(tokenPayload).toHaveProperty('exp');
    expect(tokenPayload).toHaveProperty('user_id');
    expect(tokenPayload).toHaveProperty('is_admin');
  });
});
