exports.up = (knex, Promise) => {
  return knex.schema.createTable('account', table => {
    table.bigIncrements('id');
    table.string('first_name').nullable().index();
    table.string('last_name').nullable().index();
    table.string('company_name').nullable().index();
    table.timestamps(false, true);
  });
};

exports.down = (knex, Promise) => {
  return knex.schema.dropTable('account');
};
