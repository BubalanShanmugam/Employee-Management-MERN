const { v4: uuidv4 } = require('uuid');
const { supabase } = require('../../db');

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function endOfToday() {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

// Get the date portion only (YYYY-MM-DD) for consistent date comparison
function getDateOnly(date) {
  return new Date(date).toISOString().split('T')[0];
}

async function checkin(req, res) {
  try {
    const userId = req.user.id;
    const now = new Date();
    const todayDate = getDateOnly(now);

    // Find the latest session for today
    const { data: sessions, error: findError } = await supabase
      .from('attendances')
      .select('*')
      .eq('user_id', userId)
      .eq('date', todayDate)
      .order('session_number', { ascending: false })
      .limit(1);

    if (findError) throw findError;

    const latestSession = sessions && sessions.length > 0 ? sessions[0] : null;

    // If there's an active session (checked in but not checked out), return error
    if (latestSession && latestSession.check_in_time && !latestSession.check_out_time) {
      return res.status(400).json({ message: 'Already checked in. Please check out first.' });
    }

    // Determine the new session number
    const newSessionNumber = latestSession ? latestSession.session_number + 1 : 1;
    const status = now.getHours() >= 9 ? 'late' : 'present';

    // Create a new session
    const { data: record, error: createError } = await supabase
      .from('attendances')
      .insert({
        id: uuidv4(),
        user_id: userId,
        date: todayDate,
        session_number: newSessionNumber,
        check_in_time: now.toISOString(),
        status,
        created_at: now.toISOString(),
        updated_at: now.toISOString()
      })
      .select()
      .single();

    if (createError) throw createError;

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
    const todayDate = getDateOnly(now);

    // Find the latest session for today that has check-in but no check-out
    const { data: sessions, error: findError } = await supabase
      .from('attendances')
      .select('*')
      .eq('user_id', userId)
      .eq('date', todayDate)
      .not('check_in_time', 'is', null)
      .is('check_out_time', null)
      .order('session_number', { ascending: false })
      .limit(1);

    if (findError) throw findError;

    const record = sessions && sessions.length > 0 ? sessions[0] : null;

    if (!record) {
      return res.status(400).json({ message: 'No active check-in found for today. Please check in first.' });
    }

    // Compute hours
    const hours = (now - new Date(record.check_in_time)) / (1000 * 60 * 60);
    const totalHours = Math.max(0, Number(hours.toFixed(2)));

    // Update the record
    const { data: updated, error: updateError } = await supabase
      .from('attendances')
      .update({
        check_out_time: now.toISOString(),
        total_hours: totalHours,
        updated_at: now.toISOString()
      })
      .eq('id', record.id)
      .select()
      .single();

    if (updateError) throw updateError;

    return res.status(200).json({ message: 'Checked out', record: updated });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// Helper to build date range from query param
function rangeFromQuery(q) {
  const { period, start, end } = q;
  if (start && end) return { start: new Date(start).toISOString(), end: new Date(end).toISOString() };
  const now = new Date();
  if (period === 'daily') {
    const s = new Date(now);
    s.setHours(0, 0, 0, 0);
    const e = new Date(now);
    e.setHours(23, 59, 59, 999);
    return { start: s.toISOString(), end: e.toISOString() };
  }
  if (period === 'weekly') {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    return { start: monday.toISOString(), end: sunday.toISOString() };
  }
  // default monthly
  const first = new Date();
  first.setDate(1);
  first.setHours(0, 0, 0, 0);
  const last = new Date(first);
  last.setMonth(first.getMonth() + 1);
  last.setDate(0);
  last.setHours(23, 59, 59, 999);
  return { start: first.toISOString(), end: last.toISOString() };
}

async function myHistory(req, res) {
  try {
    const userId = req.user.id;
    const { start, end } = rangeFromQuery(req.query);
    const startDate = getDateOnly(start);
    const endDate = getDateOnly(end);

    const { data: rows, error } = await supabase
      .from('attendances')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false });

    if (error) throw error;

    return res.status(200).json({ message: 'History fetched', data: rows || [] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function mySummary(req, res) {
  try {
    const userId = req.user.id;
    const { start, end } = rangeFromQuery(req.query);
    const startDate = getDateOnly(start);
    const endDate = getDateOnly(end);

    const { data: rows, error } = await supabase
      .from('attendances')
      .select('total_hours')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate);

    if (error) throw error;

    const totalHours = (rows || []).reduce((s, r) => s + Number(r.total_hours || 0), 0);
    return res.status(200).json({ message: 'Summary fetched', totalHours, count: (rows || []).length });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function last7Days(req, res) {
  try {
    const userId = req.user.id;
    
    // Calculate date range for last 7 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 6);

    const { data: rows, error } = await supabase
      .from('attendances')
      .select('*')
      .eq('user_id', userId)
      .gte('date', getDateOnly(startDate))
      .lte('date', getDateOnly(endDate))
      .order('date', { ascending: false })
      .order('session_number', { ascending: true });

    if (error) throw error;

    // Group sessions by date and calculate daily totals
    const dailyData = {};
    
    // Initialize all 7 days (even if no attendance)
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      dailyData[dateKey] = {
        date: dateKey,
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        sessions: [],
        totalHours: 0,
        status: 'absent'
      };
    }

    // Populate with actual data
    (rows || []).forEach(row => {
      const dateKey = row.date;
      if (dailyData[dateKey]) {
        dailyData[dateKey].sessions.push(row);
        dailyData[dateKey].totalHours += Number(row.total_hours || 0);
        if (dailyData[dateKey].status === 'absent') {
          dailyData[dateKey].status = row.status;
        }
      }
    });

    // Convert to array sorted by date (most recent first)
    const result = Object.values(dailyData)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .map(day => ({
        ...day,
        totalHours: Number(day.totalHours.toFixed(2)),
        sessionsCount: day.sessions.length
      }));

    return res.status(200).json({ message: 'Last 7 days fetched', data: result });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function today(req, res) {
  try {
    const userId = req.user.id;
    const todayDate = getDateOnly(new Date());
    
    // Get all sessions for today
    const { data: allSessions, error } = await supabase
      .from('attendances')
      .select('*')
      .eq('user_id', userId)
      .eq('date', todayDate)
      .order('session_number', { ascending: true });

    if (error) throw error;

    // Find the latest/active session
    const latestSession = allSessions && allSessions.length > 0 ? allSessions[allSessions.length - 1] : null;
    
    // Calculate total hours for all sessions today
    const totalHoursToday = (allSessions || []).reduce((sum, session) => sum + (session.total_hours || 0), 0);

    // Determine current status
    let currentStatus = null;
    if (latestSession) {
      currentStatus = {
        ...latestSession,
        totalHoursToday: Number(totalHoursToday.toFixed(2)),
        sessionsCount: allSessions.length,
        allSessions: allSessions
      };
    }

    return res.status(200).json({ message: 'Today fetched', data: currentStatus });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// Manager endpoints
async function allAttendances(req, res) {
  try {
    const { start, end } = rangeFromQuery(req.query);
    const startDate = getDateOnly(start);
    const endDate = getDateOnly(end);

    let query = supabase
      .from('attendances')
      .select('*, users(*)')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false });

    const { data: rows, error } = await query;
    if (error) throw error;

    // Filter by department if specified
    let filteredRows = rows || [];
    if (req.query.department) {
      filteredRows = filteredRows.filter(r => r.users && r.users.department === req.query.department);
    }

    return res.status(200).json({ message: 'All attendances fetched', data: filteredRows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function employeeAttendances(req, res) {
  try {
    const employeeId = req.params.id;
    const { start, end } = rangeFromQuery(req.query);
    const startDate = getDateOnly(start);
    const endDate = getDateOnly(end);

    const { data: rows, error } = await supabase
      .from('attendances')
      .select('*')
      .eq('user_id', employeeId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false });

    if (error) throw error;

    return res.status(200).json({ message: 'Employee attendances fetched', data: rows || [] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function teamSummary(req, res) {
  try {
    const { start, end } = rangeFromQuery(req.query);
    const startDate = getDateOnly(start);
    const endDate = getDateOnly(end);

    const { data: rows, error } = await supabase
      .from('attendances')
      .select('total_hours, users(department)')
      .gte('date', startDate)
      .lte('date', endDate);

    if (error) throw error;

    const byDept = {};
    (rows || []).forEach(r => {
      const dept = (r.users && r.users.department) || 'Unknown';
      byDept[dept] = (byDept[dept] || 0) + Number(r.total_hours || 0);
    });

    return res.status(200).json({ message: 'Team summary fetched', summary: byDept });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function todayStatus(req, res) {
  try {
    const todayDate = getDateOnly(new Date());

    let query = supabase
      .from('attendances')
      .select('*, users(*)')
      .eq('date', todayDate);

    const { data: rows, error } = await query;
    if (error) throw error;

    let filteredRows = rows || [];
    if (req.query.department) {
      filteredRows = filteredRows.filter(r => r.users && r.users.department === req.query.department);
    }

    const present = filteredRows.filter(r => r.check_in_time).map(r => ({ 
      user: r.users, 
      status: r.status 
    }));

    return res.status(200).json({ message: "Today's status fetched", present });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// Export CSV for manager
async function exportCsv(req, res) {
  try {
    const { start, end } = rangeFromQuery(req.query);
    const startDate = getDateOnly(start);
    const endDate = getDateOnly(end);

    const { data: rows, error } = await supabase
      .from('attendances')
      .select('*, users(employee_id, name, department, email)')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false });

    if (error) throw error;

    let filteredRows = rows || [];
    if (req.query.department) {
      filteredRows = filteredRows.filter(r => r.users && r.users.department === req.query.department);
    }

    // Build CSV
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="attendance_${Date.now()}.csv"`);

    // CSV header
    res.write('date,employeeId,name,email,department,checkInTime,checkOutTime,status,totalHours\n');

    for (const r of filteredRows) {
      const d = r.date || '';
      const emp = r.users || {};
      const line = [
        d,
        (emp.employee_id || ''),
        (emp.name || '').replace(/\"/g, '"'),
        (emp.email || ''),
        (emp.department || ''),
        r.check_in_time || '',
        r.check_out_time || '',
        r.status || '',
        r.total_hours || 0,
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
  last7Days,
  allAttendances,
  employeeAttendances,
  teamSummary,
  todayStatus,
  exportCsv,
};
