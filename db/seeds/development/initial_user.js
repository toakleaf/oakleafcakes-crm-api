// INSERTING A VALUE INTO AN AUTOINCREMENT (PRIMARY KEY)
// COLUMN WILL CAUSE AUTOINCREMENTING TO CEASE!
const { INITIAL_USER } = require('../../../config');

exports.seed = function(knex, Promise) {
  let roles;
  let users;
  let logins;
  return knex('user')
    .del()
    .then(() => knex('login').del())
    .then(() => knex('role').del())
    .then(() => knex('login').del())
    .then(() => knex('phone').del())
    .then(() => knex('email').del())
    .then(() => {
      return knex('role')
        .returning('role')
        .insert([
          { role: 'ADMIN' },
          { role: 'EMPLOYEE' },
          { role: 'CUSTOMER' }
        ]);
    })
    .then(role_ids => {
      roles = role_ids;
      return knex('user')
        .returning('id')
        .insert([
          {
            first_name: INITIAL_USER.first_name,
            last_name: INITIAL_USER.last_name,
            company_name: INITIAL_USER.company_name
          }
        ]);
    })
    .then(user_ids => {
      users = user_ids;
      return knex('login')
        .returning('id')
        .insert([
          {
            hash: INITIAL_USER.hash,
            email: INITIAL_USER.email,
            user_id: user_ids[0]
          }
        ]);
    })
    .then(login_ids => {
      logins = login_ids;
      return knex('login_role').insert([
        {
          role: roles[0],
          login_id: logins[0],
          user_id: users[0]
        }
      ]);
    })
    .then(() => {
      return knex('email').insert([
        {
          email: INITIAL_USER.email,
          is_primary: true,
          user_id: users[0]
        }
      ]);
    })
    .then(() => {
      return knex('phone').insert([
        {
          phone: INITIAL_USER.phone,
          is_primary: true,
          user_id: users[0]
        }
      ]);
    });
};
