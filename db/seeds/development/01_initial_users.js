// INSERTING A VALUE INTO AN AUTOINCREMENT (PRIMARY KEY)
// COLUMN WILL CAUSE AUTOINCREMENTING TO CEASE!

exports.seed = function(knex, Promise) {
  // Deletes ALL existing entries
  return knex('user')
    .del()
    .then(function() {
      // Inserts seed entries
      return knex('user').insert([{ email: 'a@a.com' }]);
    });
};
