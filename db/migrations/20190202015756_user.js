exports.up = (knex, Promise) => {
  return knex.schema.createTable('account', table => {
    table.bigIncrements('id');
    table.string('first_name').nullable();
    table.string('last_name').nullable();
    table.string('company_name').nullable();
    table.timestamps(false, true);
  });
};

exports.down = (knex, Promise) => {
  return knex.schema.dropTable('account');
};
