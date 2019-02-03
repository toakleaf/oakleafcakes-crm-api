exports.up = (knex, Promise) => {
  return knex.schema.createTable('phone', table => {
    table.bigIncrements('id');
    table
      .string('phone')
      .unique()
      .index();
    table
      .boolean('is_primary')
      .notNullable()
      .defaultTo(false);
    table
      .bigInteger('user_id')
      .notNullable()
      .references('id')
      .inTable('user')
      .onDelete('CASCADE');
    table.string('phone_type').nullable();
    table.timestamps(false, true);
  });
};

exports.down = (knex, Promise) => {
  return knex.schema.dropTable('phone');
};
