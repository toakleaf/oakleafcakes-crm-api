exports.up = function(knex, Promise) {
  return knex.schema.createTable('login', table => {
    table.bigIncrements('id');
    table.string('hash').notNullable();
    table
      .string('email')
      .notNullable()
      .unique()
      .index();
    table
      .boolean('is_admin')
      .notNullable()
      .defaultTo(false);
    table.timestamps(false, true);
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('login');
};
