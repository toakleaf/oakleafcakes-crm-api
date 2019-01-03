const db = require('../db/db');

describe('database', () => {
  afterAll(() => {
    db.destroy();
  });

  it('should be able to retrieve data from db', async () => {
    await db
      .select('*')
      .from('users')
      .then(data => {
        expect(JSON.stringify(data[0].email).length).toBeGreaterThan(0);
      });
  });
});
