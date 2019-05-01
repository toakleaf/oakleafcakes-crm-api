exports.up = (knex, Promise) => {
  return knex.schema.createTable('phone', table => {
    table.bigIncrements('id');
    table
      .string('phone')
      .index()
      .notNullable();
    table
      .string('phone_raw')
      .index()
      .notNullable();
    table
      .boolean('is_primary')
      .notNullable()
      .defaultTo(false);
    table
      .bigInteger('account_id')
      .notNullable()
      .index()
      .references('id')
      .inTable('account')
      .onDelete('CASCADE');
    table.string('phone_type').nullable();
    table
      .string('phone_country')
      .nullable()
      .defaultTo('US');
    table.timestamps(false, true);
  });
};

exports.down = (knex, Promise) => {
  return knex.schema.dropTable('phone');
};
