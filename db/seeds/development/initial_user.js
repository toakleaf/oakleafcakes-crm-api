// INSERTING A VALUE INTO AN AUTOINCREMENT (PRIMARY KEY)
// COLUMN WILL CAUSE AUTOINCREMENTING TO CEASE!
const { INITIAL_ACCOUNT } = require('../../../config');

exports.seed = function(knex, Promise) {
  let roles;
  let accounts;
  let logins;
  return knex('account')
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
      return knex('account')
        .returning('id')
        .insert([
          {
            first_name: INITIAL_ACCOUNT.first_name,
            last_name: INITIAL_ACCOUNT.last_name,
            company_name: INITIAL_ACCOUNT.company_name
          }
        ]);
    })
    .then(account_ids => {
      accounts = account_ids;
      return knex('login')
        .returning('account_id')
        .insert([
          {
            hash: INITIAL_ACCOUNT.hash,
            email: INITIAL_ACCOUNT.email,
            account_id: account_ids[0],
            is_active: true
          }
        ]);
    })
    .then(account_ids => {
      accounts = account_ids;
      return knex('account_role').insert([
        {
          role: roles[0],
          account_id: accounts[0]
        }
      ]);
    })
    .then(() => {
      return knex('email').insert([
        {
          email: INITIAL_ACCOUNT.email,
          is_primary: true,
          account_id: accounts[0]
        }
      ]);
    })
    .then(() => {
      return knex('phone').insert([
        {
          phone: INITIAL_ACCOUNT.phone,
          is_primary: true,
          phone_type: 'mobile',
          account_id: accounts[0]
        }
      ]);
    });
};
