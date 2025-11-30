const db = require('../src/db');

(async () => {
  try {
    await db.sequelize.authenticate();
    const managers = await db.models.User.findAll({ where: { role: 'manager' } });
    console.log('Managers:');
    for (const m of managers) {
      const o = m.get({ plain: true });
      console.log({ id: o.id, email: o.email, employeeId: o.employeeId, passwordHashLength: o.password ? o.password.length : 0 });
    }
  } catch (err) {
    console.error('Error listing managers:', err);
  } finally {
    await db.sequelize.close();
  }
})();
