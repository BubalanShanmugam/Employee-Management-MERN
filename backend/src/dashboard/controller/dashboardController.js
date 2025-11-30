const { supabase } = require('../../db');

// Helper to get date only
function getDateOnly(date) {
  return new Date(date).toISOString().split('T')[0];
}

// GET /dashboard/employee
// Returns: Today's status, this month stats (present, absent, late), total hours, recent attendance
async function employeeStats(req, res) {
  try {
    const userId = req.user.id;
    const now = new Date();
    const todayDate = getDateOnly(now);
    
    // Get first and last day of current month
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const firstDate = getDateOnly(firstOfMonth);
    const lastDate = getDateOnly(lastOfMonth);

    // Get all attendance records for this month
    const { data: monthlyRecords, error: monthError } = await supabase
      .from('attendances')
      .select('*')
      .eq('user_id', userId)
      .gte('date', firstDate)
      .lte('date', lastDate);

    if (monthError) throw monthError;

    // Calculate monthly stats
    const totalHours = (monthlyRecords || []).reduce((s, r) => s + Number(r.total_hours || 0), 0);
    const presentDays = (monthlyRecords || []).filter(r => r.status === 'present').length;
    const lateDays = (monthlyRecords || []).filter(r => r.status === 'late').length;
    
    // Get unique dates this month to calculate absent days
    const workedDates = new Set((monthlyRecords || []).map(r => r.date));
    
    // Calculate working days (excluding weekends) up to today
    let workingDaysCount = 0;
    const today = new Date();
    for (let d = new Date(firstOfMonth); d <= today && d <= lastOfMonth; d.setDate(d.getDate() + 1)) {
      const dayOfWeek = d.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday or Saturday
        workingDaysCount++;
      }
    }
    const absentDays = Math.max(0, workingDaysCount - workedDates.size);

    // Get today's status
    const { data: todaySessions, error: todayError } = await supabase
      .from('attendances')
      .select('*')
      .eq('user_id', userId)
      .eq('date', todayDate)
      .order('session_number', { ascending: true });

    if (todayError) throw todayError;

    let todayStatus = null;
    if (todaySessions && todaySessions.length > 0) {
      const latestSession = todaySessions[todaySessions.length - 1];
      const totalHoursToday = todaySessions.reduce((sum, s) => sum + (s.total_hours || 0), 0);
      todayStatus = {
        status: latestSession.status,
        checkInTime: latestSession.check_in_time,
        checkOutTime: latestSession.check_out_time,
        sessionsCount: todaySessions.length,
        totalHoursToday: Number(totalHoursToday.toFixed(2)),
        isCheckedIn: latestSession.check_in_time && !latestSession.check_out_time
      };
    }

    // Get last 7 days attendance
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 6);
    
    const { data: recentRecords, error: recentError } = await supabase
      .from('attendances')
      .select('*')
      .eq('user_id', userId)
      .gte('date', getDateOnly(startDate))
      .lte('date', todayDate)
      .order('date', { ascending: false });

    if (recentError) throw recentError;

    // Group by date for recent attendance
    const recentAttendance = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = getDateOnly(d);
      const dayRecords = (recentRecords || []).filter(r => r.date === dateKey);
      
      recentAttendance.push({
        date: dateKey,
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        status: dayRecords.length > 0 ? dayRecords[0].status : 'absent',
        totalHours: dayRecords.reduce((sum, r) => sum + (r.total_hours || 0), 0),
        sessionsCount: dayRecords.length
      });
    }

    return res.status(200).json({
      message: 'Employee dashboard',
      totalHours: Number(totalHours.toFixed(2)),
      presentDays,
      lateDays,
      absentDays,
      todayStatus,
      recentAttendance
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// GET /dashboard/manager
// Returns: Total employees, today's attendance (X present, Y absent), late arrivals, absent employees list
async function managerStats(req, res) {
  try {
    const todayDate = getDateOnly(new Date());

    // Get all employees
    const { data: allEmployees, error: empError } = await supabase
      .from('users')
      .select('id, name, email, department, employee_id')
      .eq('role', 'employee');

    if (empError) throw empError;

    const totalEmployees = (allEmployees || []).length;

    // Get today's attendance
    const { data: todayAttendance, error: todayError } = await supabase
      .from('attendances')
      .select('*, users(id, name, department, employee_id)')
      .eq('date', todayDate);

    if (todayError) throw todayError;

    // Get unique employee IDs who checked in today
    const checkedInEmployeeIds = new Set(
      (todayAttendance || [])
        .filter(a => a.check_in_time)
        .map(a => a.user_id)
    );

    // Calculate present, late, absent
    const presentRecords = (todayAttendance || []).filter(a => a.status === 'present');
    const lateRecords = (todayAttendance || []).filter(a => a.status === 'late');
    
    const presentToday = new Set(presentRecords.map(a => a.user_id)).size;
    const lateToday = new Set(lateRecords.map(a => a.user_id)).size;
    const absentToday = totalEmployees - checkedInEmployeeIds.size;

    // Get late arrivals with details
    const lateArrivals = lateRecords.map(a => ({
      id: a.user_id,
      name: a.users?.name || 'Unknown',
      department: a.users?.department || 'N/A',
      checkInTime: a.check_in_time
    }));

    // Get absent employees list
    const absentEmployees = (allEmployees || [])
      .filter(emp => !checkedInEmployeeIds.has(emp.id))
      .map(emp => ({
        id: emp.id,
        name: emp.name,
        department: emp.department || 'N/A',
        employeeId: emp.employee_id
      }));

    // Get today's status list for table
    const todayStatusList = (todayAttendance || []).map(a => ({
      id: a.user_id,
      name: a.users?.name || 'Unknown',
      department: a.users?.department || 'N/A',
      status: a.status,
      checkInTime: a.check_in_time,
      checkOutTime: a.check_out_time
    }));

    // Get monthly department summary
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const { data: monthlyData, error: monthError } = await supabase
      .from('attendances')
      .select('total_hours, users(department)')
      .gte('date', getDateOnly(firstOfMonth))
      .lte('date', getDateOnly(lastOfMonth));

    if (monthError) throw monthError;

    const byDept = {};
    (monthlyData || []).forEach(r => {
      const dept = (r.users && r.users.department) || 'Unknown';
      if (!byDept[dept]) {
        byDept[dept] = { name: dept, totalHours: 0, count: 0 };
      }
      byDept[dept].totalHours += Number(r.total_hours || 0);
      byDept[dept].count++;
    });

    const departmentData = Object.values(byDept);

    return res.status(200).json({
      message: 'Manager dashboard',
      totalEmployees,
      presentToday,
      lateToday,
      absentToday,
      lateArrivals,
      absentEmployees,
      todayStatusList,
      departmentData,
      byDept
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
}

module.exports = { employeeStats, managerStats };
