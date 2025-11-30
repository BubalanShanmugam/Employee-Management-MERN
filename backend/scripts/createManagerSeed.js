const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../src/db');

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret';

(async () => {
  try {
    await db.sequelize.authenticate();
    await db.sequelize.sync();

    const email = 'manager@example.com';
    const password = 'ManagerPass123!';

    let user = await db.models.User.findOne({ where: { email } });
    if (!user) {
      const hashed = await bcrypt.hash(password, 10);
      user = await db.models.User.create({ name: 'manager1', email, password: hashed, role: 'manager', employeeId: 'MGR001', department: 'Engineering' });
      console.log('Manager created');
    } else {
      // Ensure password matches our known password for testing
      const hashed = await bcrypt.hash(password, 10);
      await user.update({ password: hashed });
      console.log('Manager exists — password reset');
    }

    const token = jwt.sign({ id: user.id, role: 'manager' }, JWT_SECRET, { expiresIn: '7d' });
    console.log('Manager login token (use for Authorization header):');
    console.log(token);
  } catch (err) {
    console.error('Seed failed:', err);
  } finally {
    await db.sequelize.close();
  }
})();
