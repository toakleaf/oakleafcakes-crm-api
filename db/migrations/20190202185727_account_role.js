exports.up = function(knex, Promise) {
  return knex.schema.createTable('account_role', table => {
    table.primary(['account_id', 'role']);
    table
      .string('role')
      .notNullable()
      .references('role')
      .inTable('role');
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
  return knex.schema.dropTable('account_role');
};
