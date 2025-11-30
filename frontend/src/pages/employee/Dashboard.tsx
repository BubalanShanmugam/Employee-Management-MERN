import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

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
  isCheckedIn?: boolean;
  sessionsCount?: number;
  totalHoursToday?: number;
}

interface RecentAttendance {
  date: string;
  dayName: string;
  status: string;
  totalHours: number;
  sessionsCount: number;
}

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
  const [recentAttendance, setRecentAttendance] = useState<RecentAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const dashData = await api.getEmployeeDashboard();

      setStats({
        totalHours: dashData.totalHours || 0,
        presentDays: dashData.presentDays || 0,
        lateDays: dashData.lateDays || 0,
        absentDays: dashData.absentDays || 0,
      });

      setTodayStatus(dashData.todayStatus || null);
      setRecentAttendance(dashData.recentAttendance || []);
    } catch (err: any) {
      console.error('Dashboard error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    try {
      setError('');
      await api.checkin();
      await fetchDashboardData();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Check-in failed');
    }
  };

  const handleCheckOut = async () => {
    try {
      setError('');
      await api.checkout();
      await fetchDashboardData();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Check-out failed');
    }
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

  return (
    <Layout role="employee">
      <div className="space-y-6">
        {error && (
          <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Today's Status - Check In/Out */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Today's Status</h3>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              {todayStatus ? (
                <>
                  <div className={`px-4 py-2 rounded-lg font-semibold capitalize ${statusColor[todayStatus.status] || 'bg-gray-100 text-gray-800'}`}>
                    {todayStatus.isCheckedIn ? 'Checked In' : todayStatus.status}
                  </div>
                  <div className="text-sm text-gray-600">
                    {todayStatus.checkInTime && (
                      <p>Check-in: {new Date(todayStatus.checkInTime).toLocaleTimeString()}</p>
                    )}
                    {todayStatus.checkOutTime && (
                      <p>Check-out: {new Date(todayStatus.checkOutTime).toLocaleTimeString()}</p>
                    )}
                    {todayStatus.sessionsCount && todayStatus.sessionsCount > 1 && (
                      <p className="text-blue-600">Sessions today: {todayStatus.sessionsCount}</p>
                    )}
                    {todayStatus.totalHoursToday !== undefined && todayStatus.totalHoursToday > 0 && (
                      <p className="font-medium">Hours today: {todayStatus.totalHoursToday.toFixed(2)}h</p>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-gray-600">No check-in yet today</p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCheckIn}
                disabled={todayStatus?.isCheckedIn}
                className={`flex-1 md:flex-none font-bold py-2 px-6 rounded-lg transition ${
                  todayStatus?.isCheckedIn
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                ✓ Check In
              </button>
              <button
                onClick={handleCheckOut}
                disabled={!todayStatus?.isCheckedIn}
                className={`flex-1 md:flex-none font-bold py-2 px-6 rounded-lg transition ${
                  !todayStatus?.isCheckedIn
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                ✓ Check Out
              </button>
            </div>
          </div>
        </div>

        {/* This Month Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-semibold">Total Hours (This Month)</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">{stats.totalHours.toFixed(1)}</p>
            <p className="text-gray-500 text-xs mt-1">hours worked</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-semibold">Present Days</p>
            <p className="text-3xl font-bold text-green-600 mt-2">{stats.presentDays}</p>
            <p className="text-gray-500 text-xs mt-1">days</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-semibold">Late Days</p>
            <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.lateDays}</p>
            <p className="text-gray-500 text-xs mt-1">days</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-semibold">Absent Days</p>
            <p className="text-3xl font-bold text-red-600 mt-2">{stats.absentDays}</p>
            <p className="text-gray-500 text-xs mt-1">days</p>
          </div>
        </div>

        {/* Recent Attendance (Last 7 Days) */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Recent Attendance (Last 7 Days)</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Date</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Day</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Hours</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Sessions</th>
                </tr>
              </thead>
              <tbody>
                {recentAttendance.map((day, idx) => (
                  <tr key={idx} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-800">
                      {new Date(day.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{day.dayName}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${statusColor[day.status] || 'bg-gray-100 text-gray-800'}`}>
                        {day.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800">
                      {day.totalHours > 0 ? `${day.totalHours.toFixed(2)}h` : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {day.sessionsCount > 0 ? day.sessionsCount : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => navigate('/employee/mark-attendance')}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition"
            >
              📋 Mark Attendance
            </button>
            <button
              onClick={() => navigate('/employee/history')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition"
            >
              📅 View History
            </button>
            <button
              onClick={() => navigate('/employee/profile')}
              className="bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 px-4 rounded-lg transition"
            >
              👤 My Profile
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
