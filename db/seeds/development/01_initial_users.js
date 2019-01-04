// INSERTING A VALUE INTO AN AUTOINCREMENT (PRIMARY KEY)
// COLUMN WILL CAUSE AUTOINCREMENTING TO CEASE!
const { INITIAL_USER } = require('../../../config');

exports.seed = function(knex, Promise) {
  // Deletes ALL existing entries
  return knex('user')
    .del()
    .then(function() {
      // Inserts seed entries
      return knex('user').insert([
        {
          email: INITIAL_USER.email,
          first_name: INITIAL_USER.first_name,
          last_name: INITIAL_USER.last_name,
          display_name: INITIAL_USER.display_name
        }
      ]);
    });
};
