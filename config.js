module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_KEY: process.env.JWT_KEY || 'secret',
  API_KEY: process.env.API_KEY || 'secret',
  POSTGRES_DEVELOPMENT_URL: process.env.POSTGRES_DEVELOPMENT_URL,
  POSTGRES_STAGING_URL: process.env.POSTGRES_STAGING_URL,
  POSTGRES_PRODUCTION_URL: process.env.POSTGRES_PRODUCTION_URL,
  JWT_EXPIRATION: '12h',
  INITIAL_USER: {
    email: 'a@a.com',
    password: 'a',
    is_admin: true,
    user_id: 1,
    first_name: 'Adam',
    last_name: 'Zeus',
    display_name: 'azeus'
  }
};
