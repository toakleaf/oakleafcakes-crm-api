exports.up = function(knex, Promise) {
  return knex.schema.createTable('users', table => {
    table.bigIncrements('id');
    table
      .string('email')
      .notNullable()
      .unique()
      .index();
    table.timestamps(false, true);
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('users');
};
