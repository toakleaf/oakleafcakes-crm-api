// INSERTING A VALUE INTO AN AUTOINCREMENT (PRIMARY KEY)
// COLUMN WILL CAUSE AUTOINCREMENTING TO CEASE!
const { INITIAL_ACCOUNT, BCRYPT_COST_FACTOR } = require('../../../config');
const bcrypt = require('bcryptjs');

exports.seed = async function(knex, Promise) {
  let roles;
  let accounts;
  let logins;
  let hash = await bcrypt.hash(INITIAL_ACCOUNT.password, BCRYPT_COST_FACTOR);
  return (
    knex('account')
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
              hash: hash,
              email: INITIAL_ACCOUNT.email,
              account_id: account_ids[0],
              is_active: true
            }
          ]);
      })
      .then(() => {
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
          },
          {
            email: 'test2@test.com',
            is_primary: false,
            account_id: accounts[0]
          }
        ]);
      })
      .then(() => {
        let phone_raw = INITIAL_ACCOUNT.phone.replace(/[^0-9]/g, '');
        return knex('phone').insert([
          {
            phone: INITIAL_ACCOUNT.phone,
            phone_raw: phone_raw,
            is_primary: true,
            phone_type: 'mobile',
            account_id: accounts[0]
          }
        ]);
      })
      // 2nd account
      .then(() => {
        return knex('account')
          .returning('id')
          .insert([
            {
              first_name: 'John',
              last_name: 'Doe',
              company_name: 'Nope Corp'
            }
          ]);
      })
      .then(account_id => {
        accounts.push(account_id[0]);
        return knex('login')
          .returning('account_id')
          .insert([
            {
              hash: hash,
              email: 'test1@test.com',
              account_id: accounts[1],
              is_active: false
            },
            {
              hash: hash,
              email: 'test3@test.com',
              account_id: accounts[1],
              is_active: true
            },
            {
              hash: hash,
              email: 'test4@test.com',
              account_id: accounts[1],
              is_active: false
            }
          ]);
      })
      .then(() => {
        return knex('account_role').insert([
          {
            role: roles[1],
            account_id: accounts[1]
          }
        ]);
      })
      .then(() => {
        return knex('email').insert([
          {
            email: 'test1@test.com',
            is_primary: false,
            account_id: accounts[1]
          },
          {
            email: 'test3@test.com',
            is_primary: true,
            account_id: accounts[1]
          },
          {
            email: 'test4@test.com',
            is_primary: false,
            account_id: accounts[1]
          }
        ]);
      })
      .then(() => {
        let phone_raw = INITIAL_ACCOUNT.phone.replace(/[^0-9]/g, '');
        return knex('phone').insert([
          {
            phone: '(617) 999-9999',
            phone_raw: '6179999999',
            is_primary: true,
            phone_type: 'home',
            account_id: accounts[1]
          },
          {
            phone: '(617) 999-8888',
            phone_raw: '6179998888',
            is_primary: false,
            phone_type: 'work',
            account_id: accounts[1]
          }
        ]);
      })
      // 3rd account
      .then(() => {
        return knex('account')
          .returning('id')
          .insert([
            {
              first_name: 'Joe',
              last_name: 'Cool',
              company_name: 'Notta Corp'
            }
          ]);
      })
      .then(account_id => {
        accounts.push(account_id[0]);
        return knex('login')
          .returning('account_id')
          .insert([
            {
              hash: hash,
              email: 'test5@test.com',
              account_id: accounts[2],
              is_active: false
            }
          ]);
      })
      .then(() => {
        return knex('account_role').insert([
          {
            role: roles[1],
            account_id: accounts[2]
          }
        ]);
      })
      .then(() => {
        return knex('email').insert([
          {
            email: 'test5@test.com',
            is_primary: true,
            account_id: accounts[2]
          }
        ]);
      })
      .then(() => {
        let phone_raw = INITIAL_ACCOUNT.phone.replace(/[^0-9]/g, '');
        return knex('phone').insert([
          {
            phone: '(617) 999-3333',
            phone_raw: '6179993333',
            is_primary: true,
            phone_type: 'home',
            account_id: accounts[2]
          }
        ]);
      })
  );
};
