exports.up = (knex, Promise) => {
  return knex.schema.createTable('email', table => {
    table.bigIncrements('id');
    table
      .string('email')
      .unique()
      .index();
    table
      .boolean('is_primary')
      .notNullable()
      .defaultTo(false);
    table
      .bigInteger('account_id')
      .notNullable()
      .references('id')
      .inTable('account')
      .onDelete('CASCADE');
    table.timestamps(false, true);
  });
};

exports.down = (knex, Promise) => {
  return knex.schema.dropTable('email');
};
