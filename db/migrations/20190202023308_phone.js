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
      .bigInteger('account_id')
      .notNullable()
      .references('id')
      .inTable('account')
      .onDelete('CASCADE');
    table
      .string('phone_type')
      .nullable()
      .defaultTo('mobile');
    table.timestamps(false, true);
  });
};

exports.down = (knex, Promise) => {
  return knex.schema.dropTable('phone');
};
