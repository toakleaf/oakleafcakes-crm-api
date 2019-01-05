// INSERTING A VALUE INTO AN AUTOINCREMENT (PRIMARY KEY)
// COLUMN WILL CAUSE AUTOINCREMENTING TO CEASE!
const { INITIAL_USER } = require('../../../config');

exports.seed = function(knex, Promise) {
  // Deletes ALL existing entries
  return knex('login')
    .del()
    .then(function() {
      // Inserts seed entries
      return knex('login').insert([
        {
          hash: '$2a$10$2ESF8u/2KPoSSLSl/s613uodlSyMtqgkmZRkRuodX7vQE6o4VnTHu',
          email: INITIAL_USER.email,
          is_admin: INITIAL_USER.is_admin,
          user_id: INITIAL_USER.user_id
        }
      ]);
    });
};
