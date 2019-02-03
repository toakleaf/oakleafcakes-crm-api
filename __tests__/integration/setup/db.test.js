const db = require('../../../db/db');

describe('database', () => {
  afterAll(() => {
    db.destroy();
  });

  it('should be able to retrieve data from db', async () => {
    expect.assertions(1);
    const data = await db.select('*').from('account');
    expect(JSON.stringify(data[0].first_name).length).toBeGreaterThan(0);
  });
});
