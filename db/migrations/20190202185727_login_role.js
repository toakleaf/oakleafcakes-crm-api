exports.up = function(knex, Promise) {
  return knex.schema.createTable('login_role', table => {
    table.primary(['login_id', 'role']);
    table
      .string('role')
      .notNullable()
      .references('role')
      .inTable('role');
    table
      .bigInteger('login_id')
      .notNullable()
      .unique()
      .references('id')
      .inTable('login')
      .onDelete('CASCADE');
    table
      .bigInteger('user_id')
      .notNullable()
      .references('id')
      .inTable('user')
      .onDelete('CASCADE');
    table.timestamps(false, true);
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('login_role');
};
