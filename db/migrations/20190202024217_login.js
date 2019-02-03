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
      .bigInteger('user_id')
      .notNullable()
      .references('id')
      .inTable('user')
      .onDelete('CASCADE');
    table
      .string('reset_token_hash')
      .nullable()
      .defaultTo(null);
    table
      .datetime('reset_token_expiration')
      .nullable()
      .defaultTo(null);
    table.timestamps(false, true);
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('login');
};
