const { Op } = require('sequelize');
const { models } = require('../../db');

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfToday() {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

async function checkin(req, res) {
  try {
    const userId = req.user.id;
    const now = new Date();
    const todayStart = startOfToday();
    const todayEnd = endOfToday();

    let record = await models.Attendance.findOne({ where: { userId, date: { [Op.between]: [todayStart, todayEnd] } } });
    if (record) {
      // Already checked in
      if (record.checkInTime) return res.status(400).json({ message: 'Already checked in today' });
      record.checkInTime = now;
      record.status = now.getHours() >= 9 ? 'late' : 'present';
      await record.save();
      return res.status(200).json({ message: 'Checked in', record });
    }

    const status = now.getHours() >= 9 ? 'late' : 'present';
    record = await models.Attendance.create({ userId, date: now, checkInTime: now, status });
    return res.status(200).json({ message: 'Checked in', record });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function checkout(req, res) {
  try {
    const userId = req.user.id;
    const now = new Date();
    const todayStart = startOfToday();
    const todayEnd = endOfToday();

    const record = await models.Attendance.findOne({ where: { userId, date: { [Op.between]: [todayStart, todayEnd] } } });
    if (!record || !record.checkInTime) return res.status(400).json({ message: 'No check-in found for today' });

    record.checkOutTime = now;
    // compute hours
    const hours = (new Date(record.checkOutTime) - new Date(record.checkInTime)) / (1000 * 60 * 60);
    record.totalHours = Math.max(0, Number(hours.toFixed(2)));
    await record.save();

    return res.status(200).json({ message: 'Checked out', record });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// helper to build date range from query param: period=daily|weekly|monthly or start/end
function rangeFromQuery(q) {
  const { period, start, end } = q;
  if (start && end) return { start: new Date(start), end: new Date(end) };
  const now = new Date();
  if (period === 'daily') return { start: new Date(now.setHours(0, 0, 0, 0)), end: new Date(now.setHours(23, 59, 59, 999)) };
  if (period === 'weekly') {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    return { start: monday, end: sunday };
  }
  // default monthly
  const first = new Date();
  first.setDate(1);
  first.setHours(0, 0, 0, 0);
  const last = new Date(first);
  last.setMonth(first.getMonth() + 1);
  last.setDate(0);
  last.setHours(23, 59, 59, 999);
  return { start: first, end: last };
}

async function myHistory(req, res) {
  try {
    const userId = req.user.id;
    const { start, end } = rangeFromQuery(req.query);
    const where = { userId };
    where.date = { [Op.between]: [start, end] };

    const rows = await models.Attendance.findAll({ where, order: [['date', 'DESC']] });
    return res.status(200).json({ message: 'History fetched', data: rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function mySummary(req, res) {
  try {
    const userId = req.user.id;
    const { start, end } = rangeFromQuery(req.query);
    const rows = await models.Attendance.findAll({ where: { userId, date: { [Op.between]: [start, end] } } });
    const totalHours = rows.reduce((s, r) => s + Number(r.totalHours || 0), 0);
    return res.status(200).json({ message: 'Summary fetched', totalHours, count: rows.length });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function today(req, res) {
  try {
    const userId = req.user.id;
    const start = startOfToday();
    const end = endOfToday();
    const row = await models.Attendance.findOne({ where: { userId, date: { [Op.between]: [start, end] } } });
    return res.status(200).json({ message: 'Today fetched', data: row || null });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// Manager endpoints
async function allAttendances(req, res) {
  try {
    const { start, end } = rangeFromQuery(req.query);
    const where = { date: { [Op.between]: [start, end] } };
    if (req.query.department) {
      where['$User.department$'] = req.query.department;
    }
    const rows = await models.Attendance.findAll({ where, include: [{ model: models.User, attributes: ['id', 'name', 'department'] }], order: [['date', 'DESC']] });
    return res.status(200).json({ message: 'All attendances fetched', data: rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function employeeAttendances(req, res) {
  try {
    const employeeId = req.params.id;
    const { start, end } = rangeFromQuery(req.query);
    const rows = await models.Attendance.findAll({ where: { userId: employeeId, date: { [Op.between]: [start, end] } }, order: [['date', 'DESC']] });
    return res.status(200).json({ message: 'Employee attendances fetched', data: rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function teamSummary(req, res) {
  try {
    const { start, end } = rangeFromQuery(req.query);
    // Simple summary: total hours per department
    const rows = await models.Attendance.findAll({ where: { date: { [Op.between]: [start, end] } }, include: [{ model: models.User, attributes: ['department'] }] });
    const byDept = {};
    rows.forEach(r => {
      const dept = (r.User && r.User.department) || 'Unknown';
      byDept[dept] = (byDept[dept] || 0) + Number(r.totalHours || 0);
    });
    return res.status(200).json({ message: 'Team summary fetched', summary: byDept });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function todayStatus(req, res) {
  try {
    const start = startOfToday();
    const end = endOfToday();
    const where = { date: { [Op.between]: [start, end] } };
    if (req.query.department) where['$User.department$'] = req.query.department;
    const rows = await models.Attendance.findAll({ where, include: [{ model: models.User, attributes: ['id', 'name', 'department'] }] });
    const present = rows.filter(r => r.checkInTime).map(r => ({ user: r.User, status: r.status }));
    return res.status(200).json({ message: "Today's status fetched", present });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// Export CSV for manager: supports same filters as allAttendances
async function exportCsv(req, res) {
  try {
    const { start, end } = rangeFromQuery(req.query);
    const where = { date: { [Op.between]: [start, end] } };
    if (req.query.department) where['$User.department$'] = req.query.department;

    const rows = await models.Attendance.findAll({ where, include: [{ model: models.User, attributes: ['employeeId', 'name', 'department', 'email'] }], order: [['date', 'DESC']] });

    // Build CSV
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="attendance_${Date.now()}.csv"`);

    // CSV header
    res.write('date,employeeId,name,email,department,checkInTime,checkOutTime,status,totalHours\n');

    for (const r of rows) {
      const d = r.date ? new Date(r.date).toISOString().slice(0,10) : '';
      const emp = r.User || {};
      const line = [
        d,
        (emp.employeeId || ''),
        (emp.name || '').replace(/\"/g, '"'),
        (emp.email || ''),
        (emp.department || ''),
        r.checkInTime ? new Date(r.checkInTime).toISOString() : '',
        r.checkOutTime ? new Date(r.checkOutTime).toISOString() : '',
        r.status || '',
        r.totalHours || 0,
      ].map(v => typeof v === 'string' ? `"${String(v).replace(/"/g, '""')}"` : `"${v}"`).join(',');
      res.write(line + '\n');
    }

    res.end();
  } catch (err) {
    console.error('CSV export failed', err);
    return res.status(500).json({ message: 'Server error exporting CSV' });
  }
}

module.exports = {
  checkin,
  checkout,
  myHistory,
  mySummary,
  today,
  allAttendances,
  employeeAttendances,
  teamSummary,
  todayStatus,
  exportCsv,
};
