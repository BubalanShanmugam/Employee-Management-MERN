import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import Layout from '../../components/Layout';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Attendance } from '../../types';

interface DashboardStats {
  totalHours: number;
  presentDays: number;
  lateDays: number;
  absentDays: number;
}

interface TodayStatus {
  status: string;
  checkInTime?: string;
  checkOutTime?: string;
}

interface AttendanceRecord {
  date: string;
  status: string;
  checkInTime?: string;
  checkOutTime?: string;
  totalHours?: number;
}

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

export default function EmployeeDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalHours: 0,
    presentDays: 0,
    lateDays: 0,
    absentDays: 0,
  });
  const [todayStatus, setTodayStatus] = useState<TodayStatus | null>(null);
  const [recentAttendance, setRecentAttendance] = useState<AttendanceRecord[]>([]);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [monthData, setMonthData] = useState<any[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceRecord>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [date, setDate] = useState<Value>(new Date());
  const [summaryType, setSummaryType] = useState<'day' | 'week' | 'month'>('month');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [dashData, todayData, historyData] = await Promise.all([
        api.getEmployeeDashboard(),
        api.getTodayStatus(),
        api.getMyHistory(),
      ]);

      setStats({
        totalHours: dashData.totalHours || 0,
        presentDays: dashData.presentDays || 0,
        lateDays: dashData.lateDays || 0,
        absentDays: dashData.absentDays || 0,
      });

      setTodayStatus(todayData);

      // Process history data
      const data = Array.isArray(historyData) ? historyData : historyData.data || historyData;
      
      // Get last 7 days
      const sorted = data.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setRecentAttendance(sorted.slice(0, 7));

      // Create attendance map for calendar
      const map: Record<string, AttendanceRecord> = {};
      data.forEach((record: any) => {
        const dateStr = new Date(record.date).toISOString().substring(0, 10);
        map[dateStr] = record;
      });
      setAttendanceMap(map);

      // Generate weekly chart data
      const weeklyChartData = generateWeeklyData(data);
      setWeeklyData(weeklyChartData);

      // Generate monthly chart data
      const monthlyChartData = generateMonthlyData(data);
      setMonthData(monthlyChartData);

      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const generateWeeklyData = (data: any[]) => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const now = new Date();
    const weekData = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().substring(0, 10);
      const record = data.find((r: any) => new Date(r.date).toISOString().substring(0, 10) === dateStr);
      weekData.push({
        day: days[d.getDay()],
        hours: record?.totalHours || 0,
        status: record?.status || 'absent',
      });
    }
    return weekData;
  };

  const generateMonthlyData = (data: any[]) => {
    const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'];
    const monthData = weeks.map((week, idx) => ({
      week,
      hours: Math.floor(Math.random() * 40) + 30,
      present: Math.floor(Math.random() * 5) + 2,
    }));
    return monthData;
  };

  const handleCheckIn = async () => {
    try {
      await api.checkin();
      await fetchDashboardData();
    } catch (err: any) {
      setError(err.message || 'Check-in failed');
    }
  };

  const handleCheckOut = async () => {
    try {
      await api.checkout();
      await fetchDashboardData();
    } catch (err: any) {
      setError(err.message || 'Check-out failed');
    }
  };

  const getTileClassName = ({ date: tileDate }: { date: Date }) => {
    const dateStr = tileDate.toISOString().substring(0, 10);
    const record = attendanceMap[dateStr];

    if (record) {
      switch (record.status) {
        case 'present':
          return 'bg-green-500 text-white';
        case 'absent':
          return 'bg-red-500 text-white';
        case 'late':
          return 'bg-yellow-500 text-white';
        case 'half-day':
          return 'bg-orange-500 text-white';
      }
    }
    return '';
  };

  if (loading) {
    return (
      <Layout role="employee">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  const statusColor: Record<string, string> = {
    'present': 'bg-green-100 text-green-800',
    'absent': 'bg-red-100 text-red-800',
    'late': 'bg-yellow-100 text-yellow-800',
    'half-day': 'bg-orange-100 text-orange-800',
  };

  const pieData = [
    { name: 'Present', value: stats.presentDays, color: '#10b981' },
    { name: 'Late', value: stats.lateDays, color: '#f59e0b' },
    { name: 'Absent', value: stats.absentDays, color: '#ef4444' },
  ];

  return (
    <Layout role="employee">
      <div className="space-y-6">
        {error && (
          <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg shadow p-8">
          <h1 className="text-4xl font-bold mb-2">Welcome, {user?.name}! 👋</h1>
          <p className="text-blue-100">Your attendance dashboard - {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        {/* Today's Status - Large Card */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Today's Check-In Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="col-span-1 md:col-span-2">
              {todayStatus ? (
                <div className="space-y-4">
                  <div className={`p-6 rounded-lg font-bold text-lg capitalize ${
                    statusColor[todayStatus.status as keyof typeof statusColor] || 'bg-gray-100 text-gray-800'
                  }`}>
                    Status: {todayStatus.status}
                  </div>
                  {todayStatus.checkInTime && (
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-gray-600">Check-in Time</p>
                      <p className="text-xl font-bold text-blue-600">{new Date(todayStatus.checkInTime).toLocaleTimeString()}</p>
                    </div>
                  )}
                  {todayStatus.checkOutTime && (
                    <div className="p-4 bg-green-50 rounded-lg">
                      <p className="text-sm text-gray-600">Check-out Time</p>
                      <p className="text-xl font-bold text-green-600">{new Date(todayStatus.checkOutTime).toLocaleTimeString()}</p>
                    </div>
                  )}
                  {!todayStatus.checkInTime && (
                    <p className="text-gray-500 text-center py-4">No check-in yet today</p>
                  )}
                </div>
              ) : (
                <p className="text-gray-600 text-center py-8">No check-in yet today</p>
              )}
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleCheckIn}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-lg transition text-lg"
              >
                ✓ Check In
              </button>
              <button
                onClick={handleCheckOut}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-lg transition text-lg"
              >
                ✓ Check Out
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow p-6 border-l-4 border-blue-600">
            <p className="text-gray-600 text-sm font-semibold">Total Hours (This Month)</p>
            <p className="text-4xl font-bold text-blue-600 mt-3">{stats.totalHours}</p>
            <p className="text-gray-500 text-xs mt-2">hours worked</p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow p-6 border-l-4 border-green-600">
            <p className="text-gray-600 text-sm font-semibold">Present Days</p>
            <p className="text-4xl font-bold text-green-600 mt-3">{stats.presentDays}</p>
            <p className="text-gray-500 text-xs mt-2">days</p>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg shadow p-6 border-l-4 border-yellow-600">
            <p className="text-gray-600 text-sm font-semibold">Late Days</p>
            <p className="text-4xl font-bold text-yellow-600 mt-3">{stats.lateDays}</p>
            <p className="text-gray-500 text-xs mt-2">days</p>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg shadow p-6 border-l-4 border-red-600">
            <p className="text-gray-600 text-sm font-semibold">Absent Days</p>
            <p className="text-4xl font-bold text-red-600 mt-3">{stats.absentDays}</p>
            <p className="text-gray-500 text-xs mt-2">days</p>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Weekly Attendance Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Weekly Attendance Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="hours" fill="#3b82f6" name="Hours Worked" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Attendance Distribution Pie Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Attendance Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Calendar and Recent Attendance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Calendar */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">This Month's Attendance</h3>
            <div className="calendar-container flex justify-center">
              <Calendar
                value={date}
                onChange={setDate}
                tileClassName={getTileClassName}
                maxDate={new Date()}
              />
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center gap-2"><div className="w-4 h-4 bg-green-500 rounded"></div><span>Present</span></div>
              <div className="flex items-center gap-2"><div className="w-4 h-4 bg-yellow-500 rounded"></div><span>Late</span></div>
              <div className="flex items-center gap-2"><div className="w-4 h-4 bg-orange-500 rounded"></div><span>Half-day</span></div>
              <div className="flex items-center gap-2"><div className="w-4 h-4 bg-red-500 rounded"></div><span>Absent</span></div>
            </div>
          </div>

          {/* Recent Attendance */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Recent Attendance (Last 7 Days)</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {recentAttendance.length > 0 ? (
                recentAttendance.map((record, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 rounded-lg border-l-4" style={{
                    borderColor: record.status === 'present' ? '#10b981' : record.status === 'absent' ? '#ef4444' : record.status === 'late' ? '#f59e0b' : '#f97316'
                  }}>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-gray-800">{new Date(record.date).toLocaleDateString()}</p>
                        <p className={`text-sm font-bold capitalize ${statusColor[record.status as keyof typeof statusColor]}`}>{record.status}</p>
                      </div>
                      <div className="text-right text-sm text-gray-600">
                        {record.checkInTime && <p>{new Date(record.checkInTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>}
                        {record.totalHours && <p className="font-semibold">{record.totalHours}h</p>}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-8">No recent attendance records</p>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => navigate('/employee/mark-attendance')}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
            >
              📋 Mark Attendance
            </button>
            <button
              onClick={() => navigate('/employee/history')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
            >
              📅 View History
            </button>
            <button
              onClick={() => navigate('/employee/profile')}
              className="bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
            >
              👤 My Profile
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
