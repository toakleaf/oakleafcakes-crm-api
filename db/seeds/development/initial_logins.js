exports.seed = function(knex, Promise) {
  // Deletes ALL existing entries
  return knex('login')
    .del()
    .then(function() {
      // Inserts seed entries
      return knex('login').insert([
        {
          id: 1,
          hash: '$2a$10$WAK21U0LWl7C//jJ.DOB2uPP1DJQh7KUDgasdyQeGzkop2Pzl8W7u',
          email: 'a@a.com',
          is_admin: 'TRUE'
        }
      ]);
    });
};
