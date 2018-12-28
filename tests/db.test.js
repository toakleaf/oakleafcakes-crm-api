const knex = require('knex');

describe('database', () => {
  it('should connect to the db', () => {
    const db = knex({
      client: 'pg',
      connection: process.env.POSTGRES_URI
    });
    db.select('*')
      .from('users')
      .then(data => expect(data.length).toBeGreaterThan(0));
  });
});
