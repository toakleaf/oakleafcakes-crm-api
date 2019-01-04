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
          hash: '$2a$10$WAK21U0LWl7C//jJ.DOB2uPP1DJQh7KUDgasdyQeGzkop2Pzl8W7u',
          email: INITIAL_USER.email,
          is_admin: INITIAL_USER.is_admin,
          user_id: INITIAL_USER.user_id
        }
      ]);
    });
};
