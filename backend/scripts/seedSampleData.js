const bcrypt = require('bcrypt');
const { sequelize, models } = require('../src/db');

async function seed() {
  try {
    await sequelize.authenticate();
    console.log('DB connected — syncing models (safe: alter:false)');
    await sequelize.sync({ alter: false });

    const DEFAULT_PASSWORD = 'Password123!';
    const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;
    const hashedDefault = await bcrypt.hash(DEFAULT_PASSWORD, saltRounds);

    // Manager
    const [manager, mCreated] = await models.User.findOrCreate({
      where: { email: 'manager@example.com' },
      defaults: {
        name: 'Manager One',
        email: 'manager@example.com',
        password: hashedDefault,
        role: 'manager',
        employeeId: 'MGR001',
        department: 'Management',
      }
    });
    if (mCreated) console.log('Created manager:', manager.email);

    // Departments
    const departments = ['Engineering', 'Sales', 'HR'];

    // Create 20 employees
    const employees = [];
    for (let i = 1; i <= 20; i++) {
      const empId = `EMP${String(i).padStart(3, '0')}`;
      const email = `employee${i}@example.com`;
      const [user, created] = await models.User.findOrCreate({
        where: { email },
        defaults: {
          name: `Employee ${i}`,
          email,
          password: hashedDefault,
          role: 'employee',
          employeeId: empId,
          department: departments[i % departments.length],
        }
      });
      if (created) console.log('Created user:', email);
      employees.push(user);
    }

    // Create sample attendance for last 30 days for each employee
    const days = 30;
    const statuses = ['present', 'absent', 'late', 'half-day'];

    const today = new Date();
    for (const user of employees) {
      for (let d = 0; d < days; d++) {
        const date = new Date(today);
        date.setDate(today.getDate() - d);
        const dateOnly = date.toISOString().slice(0, 10); // YYYY-MM-DD

        // Don't duplicate
        const exists = await models.Attendance.findOne({ where: { userId: user.id, date: dateOnly } });
        if (exists) continue;

        // Randomize status (bias present)
        const r = Math.random();
        let status = 'present';
        if (r > 0.95) status = 'absent';
        else if (r > 0.85) status = 'late';
        else if (r > 0.8) status = 'half-day';

        let checkIn = null;
        let checkOut = null;
        let totalHours = 0;
        if (status !== 'absent') {
          const baseCheckIn = new Date(dateOnly + 'T09:00:00');
          // late by up to 60 minutes
          if (status === 'late') baseCheckIn.setMinutes(baseCheckIn.getMinutes() + Math.floor(Math.random() * 60));
          checkIn = baseCheckIn;

          const baseCheckOut = new Date(dateOnly + 'T17:30:00');
          // half-day leave reduces hours
          if (status === 'half-day') baseCheckOut.setHours(baseCheckOut.getHours() - 4);
          checkOut = baseCheckOut;

          totalHours = (checkOut - checkIn) / (1000 * 60 * 60);
        }

        await models.Attendance.create({
          userId: user.id,
          date: dateOnly,
          checkInTime: checkIn,
          checkOutTime: checkOut,
          status,
          totalHours,
        });
      }
    }

    console.log('Seeding complete. Default password for all seeded users:', DEFAULT_PASSWORD);
    console.log('Created 1 manager and', employees.length, 'employees with', days, 'days of attendance each.');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed', err);
    process.exit(1);
  }
}

seed();
