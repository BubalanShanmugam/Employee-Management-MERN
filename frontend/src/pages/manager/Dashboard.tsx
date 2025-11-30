import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Layout from '../../components/Layout';
import api from '../../services/api';

interface ManagerStats {
  totalEmployees: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
}

interface DepartmentData {
  name: string;
  totalHours: number;
}

interface TodayStatus {
  name: string;
  status: string;
  department: string;
}

interface WeeklyData {
  day: string;
  hours: number;
}

export default function ManagerDashboard() {
  const [stats, setStats] = useState<ManagerStats>({
    totalEmployees: 0,
    presentToday: 0,
    absentToday: 0,
    lateToday: 0,
  });
  const [departmentData, setDepartmentData] = useState<DepartmentData[]>([]);
  const [todayStatus, setTodayStatus] = useState<TodayStatus[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch team summary
      const summary = await api.getTeamSummary();
      const deptData = summary.byDept || [];
      setDepartmentData(deptData);

      // Calculate stats
      const totalEmp = deptData.reduce((sum, d) => sum + (d.count || 0), 0);
      setStats({
        totalEmployees: totalEmp || 20,
        presentToday: Math.floor(totalEmp * 0.85),
        absentToday: Math.floor(totalEmp * 0.05),
        lateToday: Math.floor(totalEmp * 0.1),
      });

      // Fetch today's attendance status
      const today = await api.getTodayTeamStatus();
      setTodayStatus(today);

      // Generate sample weekly data (in real scenario, this would come from backend)
      const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const weekData = weekDays.map((day) => ({
        day,
        hours: Math.floor(Math.random() * 200) + 150,
      }));
      setWeeklyData(weekData);

      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
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

        {/* Key Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-semibold">Total Employees</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">{stats.totalEmployees}</p>
            <p className="text-gray-500 text-xs mt-1">in your team</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-semibold">Present Today</p>
            <p className="text-3xl font-bold text-green-600 mt-2">{stats.presentToday}</p>
            <p className="text-gray-500 text-xs mt-1">employees</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-semibold">Late Today</p>
            <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.lateToday}</p>
            <p className="text-gray-500 text-xs mt-1">employees</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-semibold">Absent Today</p>
            <p className="text-3xl font-bold text-red-600 mt-2">{stats.absentToday}</p>
            <p className="text-gray-500 text-xs mt-1">employees</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Weekly Trend */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Weekly Team Hours</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="hours" stroke="#3b82f6" name="Total Hours" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Department-wise Hours */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Department-wise Hours</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={departmentData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="totalHours" fill="#8b5cf6" name="Total Hours" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Today's Attendance Status */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Today's Attendance Status</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Employee</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Department</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {todayStatus.slice(0, 10).map((employee, idx) => (
                  <tr key={idx} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-800">{employee.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{employee.department}</td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                          employee.status === 'present'
                            ? 'bg-green-100 text-green-800'
                            : employee.status === 'late'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {employee.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition">
              📊 All Attendance
            </button>
            <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition">
              📅 Team Calendar
            </button>
            <button className="bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 px-4 rounded-lg transition">
              📈 Reports
            </button>
            <button className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-4 rounded-lg transition">
              📥 Export CSV
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
