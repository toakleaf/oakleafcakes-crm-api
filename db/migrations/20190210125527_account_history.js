exports.up = function(knex, Promise) {
  return knex.schema.createTable('account_history', table => {
    table.bigIncrements('id');
    table
      .bigInteger('account_id')
      .notNullable()
      .index()
      .references('id')
      // all account history will be deleted when referenced account is deleted
      .inTable('account')
      .onDelete('CASCADE');
    table
      .bigInteger('author')
      // not foreign key so log is preserved even if author account is deleted
      .notNullable()
      .index();
    table
      .enu('action', ['CREATE', 'UPDATE', 'DELETE'], {
        useNative: true,
        enumName: 'ACTION'
      })
      .notNullable();
    table.json('transaction').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('account_history');
};
