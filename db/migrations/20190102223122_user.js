exports.up = function(knex, Promise) {
  return knex.schema.createTable('user', table => {
    table.bigIncrements('id');
    table
      .string('email')
      .notNullable()
      .unique()
      .index();
    table.string('first_name').nullable();
    table.string('last_name').nullable();
    table.string('display_name').nullable();
    table.timestamps(false, true);
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('user');
};
