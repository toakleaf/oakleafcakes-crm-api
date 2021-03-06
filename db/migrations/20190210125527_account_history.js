exports.up = function(knex, Promise) {
  return knex.schema.createTable('account_history', table => {
    table.bigIncrements('id');
    // no foreign keys so log is preserved even if author account is deleted
    table
      .bigInteger('account_id')
      .notNullable()
      .index();
    table
      .bigInteger('author_id')
      .notNullable()
      .index();
    table.string('author_name').nullable();
    table.enu('action', ['CREATE', 'UPDATE', 'DELETE']).notNullable();
    table.enu('status', ['SUCCESS', 'ERROR', 'PENDING']).notNullable();
    table.json('request').nullable();
    table.json('state').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('account_history');
};
