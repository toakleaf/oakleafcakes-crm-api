exports.up = (knex, Promise) => {
  return knex.schema.createTable('role', table => {
    table
      .string('role')
      .unique()
      .primary();
  });
};

exports.down = (knex, Promise) => {
  return knex.schema.dropTable('role');
};
