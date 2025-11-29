const { models } = require('../../db');

async function employeeStats(req, res) {
  try {
    const userId = req.user.id;
    // Simple stats: total days present this month and total hours
    const now = new Date();
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    const last = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const rows = await models.Attendance.findAll({ where: { userId, date: { [models.Sequelize.Op.between]: [first, last] } } });
    const totalHours = rows.reduce((s, r) => s + Number(r.totalHours || 0), 0);
    const presentDays = rows.filter(r => r.checkInTime).length;
    return res.status(200).json({ message: 'Employee dashboard', totalHours, presentDays });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function managerStats(req, res) {
  try {
    // For manager: team totals this month
    const now = new Date();
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    const last = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const rows = await models.Attendance.findAll({ where: { date: { [models.Sequelize.Op.between]: [first, last] } }, include: [{ model: models.User, attributes: ['department'] }] });
    const totalHours = rows.reduce((s, r) => s + Number(r.totalHours || 0), 0);
    const byDept = {};
    rows.forEach(r => {
      const dept = (r.User && r.User.department) || 'Unknown';
      byDept[dept] = (byDept[dept] || 0) + Number(r.totalHours || 0);
    });
    return res.status(200).json({ message: 'Manager dashboard', totalHours, byDept });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

module.exports = { employeeStats, managerStats };
