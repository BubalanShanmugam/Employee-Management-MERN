import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, AreaChart, Area } from 'recharts';
import Layout from '../../components/Layout';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface TeamStats {
  totalEmployees: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
}

interface EmployeeStatus {
  employeeId: string;
  employeeName: string;
  status: string;
  checkInTime?: string;
  department?: string;
}

interface DepartmentData {
  department: string;
  count: number;
}

export default function ManagerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [teamStats, setTeamStats] = useState<TeamStats>({
    totalEmployees: 0,
    presentToday: 0,
    absentToday: 0,
    lateToday: 0,
  });
  const [todayStatus, setTodayStatus] = useState<EmployeeStatus[]>([]);
  const [departmentData, setDepartmentData] = useState<DepartmentData[]>([]);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchManagerDashboard();
  }, []);

  const fetchManagerDashboard = async () => {
    try {
      setLoading(true);
      const [teamSummary, teamStatus] = await Promise.all([
        api.getTeamSummary(),
        api.getTodayTeamStatus(),
      ]);

      setTeamStats({
        totalEmployees: teamSummary.totalEmployees || 0,
        presentToday: teamSummary.present || 0,
        absentToday: teamSummary.absent || 0,
        lateToday: teamSummary.late || 0,
      });

      // Process today's status
      const statusArray = Array.isArray(teamStatus) ? teamStatus : teamStatus.present || [];
      setTodayStatus(statusArray);

      // Generate department data
      const deptData = generateDepartmentData(statusArray);
      setDepartmentData(deptData);

      // Generate weekly data
      const weekData = generateWeeklyData();
      setWeeklyData(weekData);

      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const generateDepartmentData = (statusData: any[]) => {
    const departments: Record<string, number> = {};
    statusData.forEach((emp: any) => {
      const dept = emp.department || 'Not Assigned';
      departments[dept] = (departments[dept] || 0) + 1;
    });
    return Object.entries(departments).map(([dept, count]) => ({
      department: dept,
      count,
    }));
  };

  const generateWeeklyData = () => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return days.map((day, idx) => ({
      day: day.substring(0, 3),
      present: Math.floor(Math.random() * 20) + 15,
      absent: Math.floor(Math.random() * 5),
      late: Math.floor(Math.random() * 3),
    }));
  };

  const getAbsentEmployees = () => {
    return todayStatus.filter((emp: any) => emp.status === 'absent');
  };

  const getLateEmployees = () => {
    return todayStatus.filter((emp: any) => emp.status === 'late');
  };

  const handleExportCsv = async () => {
    try {
      const blob = await api.exportCsv();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attendance_${new Date().toISOString().substring(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || 'Failed to export CSV');
    }
  };

  if (loading) {
    return (
      <Layout role="manager">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout role="manager">
      <div className="space-y-6">
        {error && (
          <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg shadow p-8">
          <h1 className="text-4xl font-bold mb-2">Welcome, {user?.name}! 👋</h1>
          <p className="text-blue-100">Team Attendance Manager Dashboard - {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        {/* Team Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow p-6 border-l-4 border-blue-600">
            <p className="text-gray-600 text-sm font-semibold">Total Employees</p>
            <p className="text-4xl font-bold text-blue-600 mt-3">{teamStats.totalEmployees}</p>
            <p className="text-gray-500 text-xs mt-2">in your team</p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow p-6 border-l-4 border-green-600">
            <p className="text-gray-600 text-sm font-semibold">Present Today</p>
            <p className="text-4xl font-bold text-green-600 mt-3">{teamStats.presentToday}</p>
            <p className="text-gray-500 text-xs mt-2">employees</p>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg shadow p-6 border-l-4 border-yellow-600">
            <p className="text-gray-600 text-sm font-semibold">Late Today</p>
            <p className="text-4xl font-bold text-yellow-600 mt-3">{teamStats.lateToday}</p>
            <p className="text-gray-500 text-xs mt-2">employees</p>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg shadow p-6 border-l-4 border-red-600">
            <p className="text-gray-600 text-sm font-semibold">Absent Today</p>
            <p className="text-4xl font-bold text-red-600 mt-3">{teamStats.absentToday}</p>
            <p className="text-gray-500 text-xs mt-2">employees</p>
          </div>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Weekly Attendance Trend */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Weekly Attendance Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={weeklyData}>
                <defs>
                  <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="present" stroke="#10b981" fillOpacity={1} fill="url(#colorPresent)" />
                <Area type="monotone" dataKey="late" stroke="#f59e0b" fillOpacity={0.1} />
                <Area type="monotone" dataKey="absent" stroke="#ef4444" fillOpacity={0.1} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Attendance Status Distribution */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Today's Attendance Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Present', value: teamStats.presentToday, color: '#10b981' },
                    { name: 'Late', value: teamStats.lateToday, color: '#f59e0b' },
                    { name: 'Absent', value: teamStats.absentToday, color: '#ef4444' },
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  <Cell fill="#10b981" />
                  <Cell fill="#f59e0b" />
                  <Cell fill="#ef4444" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Department Distribution */}
          {departmentData.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Employees by Department</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={departmentData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="department" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" name="Employees" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Today's Present Employees */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Present Today ({todayStatus.filter((e: any) => e.status === 'present').length})</h3>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {todayStatus.filter((emp: any) => emp.status === 'present').slice(0, 10).map((emp: any, idx) => (
                <div key={idx} className="p-3 bg-green-50 rounded-lg border-l-4 border-green-600 flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-gray-800">{emp.employeeName}</p>
                    <p className="text-xs text-gray-500">{emp.department || 'Not Assigned'}</p>
                  </div>
                  {emp.checkInTime && (
                    <p className="text-sm text-green-600 font-semibold">{new Date(emp.checkInTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                  )}
                </div>
              ))}
              {todayStatus.filter((e: any) => e.status === 'present').length === 0 && (
                <p className="text-center text-gray-500 py-4">No employees present yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Alerts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Absent Employees */}
          <div className="bg-white rounded-lg shadow p-6 border-t-4 border-red-600">
            <h3 className="text-xl font-bold text-gray-800 mb-4">🔴 Absent Today ({getAbsentEmployees().length})</h3>
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {getAbsentEmployees().length > 0 ? (
                getAbsentEmployees().map((emp: any, idx) => (
                  <div key={idx} className="p-3 bg-red-50 rounded-lg border-l-4 border-red-600">
                    <p className="font-semibold text-gray-800">{emp.employeeName}</p>
                    <p className="text-xs text-gray-500">{emp.department || 'Not Assigned'}</p>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-4">No absent employees today</p>
              )}
            </div>
          </div>

          {/* Late Employees */}
          <div className="bg-white rounded-lg shadow p-6 border-t-4 border-yellow-600">
            <h3 className="text-xl font-bold text-gray-800 mb-4">⚠️ Late Today ({getLateEmployees().length})</h3>
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {getLateEmployees().length > 0 ? (
                getLateEmployees().map((emp: any, idx) => (
                  <div key={idx} className="p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-600 flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-800">{emp.employeeName}</p>
                      <p className="text-xs text-gray-500">{emp.department || 'Not Assigned'}</p>
                    </div>
                    {emp.checkInTime && (
                      <p className="text-sm text-yellow-600 font-semibold">{new Date(emp.checkInTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-4">No late employees today</p>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => navigate('/manager/all-attendance')}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
            >
              📋 View All Attendance
            </button>
            <button
              onClick={() => navigate('/manager/team-summary')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
            >
              📊 Team Summary
            </button>
            <button
              onClick={handleExportCsv}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
            >
              📥 Export CSV
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
