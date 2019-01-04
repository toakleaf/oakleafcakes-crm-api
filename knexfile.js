const config = require('./config');

module.exports = {
  development: {
    client: 'pg',
    connection: config.POSTGRES_DEVELOPMENT_URL,
    migrations: {
      directory: __dirname + '/db/migrations'
    },
    seeds: {
      directory: __dirname + '/db/seeds/development'
    }
  },
  staging: {
    client: 'pg',
    connection: config.POSTGRES_STAGING_URL,
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      directory: __dirname + '/db/migrations'
    },
    seeds: {
      directory: __dirname + '/db/seeds/staging'
    }
  },
  production: {
    client: 'postgresql',
    connection: config.POSTGRES_PRODUCTION_URL,
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      directory: __dirname + '/db/migrations'
    },
    seeds: {
      directory: __dirname + '/db/seeds/production'
    }
  }
};
