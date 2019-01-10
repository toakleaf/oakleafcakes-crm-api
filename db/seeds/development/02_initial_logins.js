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
          hash: '$2y$10$jUF/52IihR9kuCP4t47bZeIidt5F/S2ZCvHj80TDI7ELTJJTBK6Ei',
          email: INITIAL_USER.email,
          is_admin: INITIAL_USER.is_admin,
          user_id: INITIAL_USER.user_id
        }
      ]);
    });
};
