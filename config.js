module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  COMPANY_NAME: process.env.COMPANY_NAME || 'Test CRM',
  COMPANY_SITE: process.env.COMPANY_SITE || 'test.com',
  COMPANY_EMAIL: process.env.COMPANY_EMAIL || 'test@test.com',
  JWT_KEY: process.env.JWT_KEY || 'secret',
  API_KEY: process.env.API_KEY || 'secret',
  POSTGRES_DEVELOPMENT_URL: process.env.POSTGRES_DEVELOPMENT_URL,
  POSTGRES_STAGING_URL: process.env.POSTGRES_STAGING_URL,
  POSTGRES_PRODUCTION_URL: process.env.POSTGRES_PRODUCTION_URL,
  BCRYPT_COST_FACTOR: 10,
  JWT_EXPIRATION: '12h',
  INITIAL_ACCOUNT: {
    email: process.env.TEST_EMAIL_RECIPIENT || 'test@test.com',
    password: '1234567891011',
    hash: '$2y$10$jUF/52IihR9kuCP4t47bZeIidt5F/S2ZCvHj80TDI7ELTJJTBK6Ei',
    account_id: 1,
    roll: 'ADMIN',
    first_name: 'Tyler',
    last_name: 'Oakleaf',
    phone: '999-999-9999',
    company_name: 'Fake Corp'
  },
  TEST_EMAIL_RECIPIENT:
    process.env.TEST_EMAIL_RECIPIENT || process.env.GMAIL_CLIENT_USER,
  GMAIL: {
    client_user: process.env.GMAIL_CLIENT_USER,
    client_id: process.env.GMAIL_CLIENT_ID,
    secret: process.env.GMAIL_SECRET,
    refresh_token: process.env.GMAIL_REFRESH_TOKEN,
    access_token: process.env.GMAIL_ACCESS_TOKEN //this might expire?
  },
  MIN_PASSWORD_LENGTH: 12,
  MAX_PASSWORD_LENGTH: 64
};
