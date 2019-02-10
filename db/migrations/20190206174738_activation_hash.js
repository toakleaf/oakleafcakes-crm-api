exports.up = function(knex, Promise) {
  return knex.schema.createTable('activation_hash', table => {
    table.bigIncrements('id');
    table.string('hash').notNullable();
    table
      .bigInteger('account_id')
      .notNullable()
      .index()
      .references('id')
      .inTable('account')
      .onDelete('CASCADE');
    table.timestamps(false, true);
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('activation_hash');
};
