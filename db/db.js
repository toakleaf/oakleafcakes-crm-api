const config = require('../knexfile.js');
const env = process.env.ENVIRONMENT || 'development';
const db = require('knex')(config[env]);

module.exports = db;

// db.migrate.latest([config]); //runs on server/nodemon startup
