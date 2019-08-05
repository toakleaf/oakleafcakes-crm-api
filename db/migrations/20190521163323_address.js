exports.up = (knex, Promise) => {
  return knex.schema.createTable('address', table => {
    table.bigIncrements('id');
    table
      .bigInteger('account_id')
      .notNullable()
      .index()
      .references('id')
      .inTable('account')
      .onDelete('CASCADE');
    table
      .string('recipient')
      .index()
      .nullable();
    table
      .string('recipient2')
      .index()
      .nullable();
    table
      .string('address')
      .index()
      .nullable();
    table
      .string('address2')
      .index()
      .nullable();
    table
      .string('address3')
      .index()
      .nullable();
    table
      .string('city')
      .index()
      .nullable();
    table
      .string('state')
      .index()
      .nullable();
    table
      .string('zip')
      .index()
      .nullable();
    table
      .string('country')
      .index()
      .nullable()
      .defaultTo('US');
    table
      .boolean('is_primary')
      .notNullable()
      .defaultTo(false);
    table.string('type').nullable();
    table.timestamps(false, true);
  });
};

exports.down = (knex, Promise) => {
  return knex.schema.dropTable('address');
};
