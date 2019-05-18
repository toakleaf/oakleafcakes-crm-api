exports.up = (knex, Promise) => {
  return knex.schema.createTable('preferences', table => {
    table.bigIncrements('id');
    table
      .bigInteger('account_id')
      .notNullable()
      .index()
      .references('id')
      .inTable('account')
      .onDelete('CASCADE');
    table.json('preferences').defaultTo('{}');
    table.timestamps(false, true);
  });
};

exports.down = (knex, Promise) => {
  return knex.schema.dropTable('preferences');
};
