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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [dashData, todayData] = await Promise.all([
        api.getEmployeeDashboard(),
        api.getTodayStatus(),
      ]);

      setStats({
        totalHours: dashData.totalHours || 0,
        presentDays: dashData.presentDays || 0,
        lateDays: dashData.lateDays || 0,
        absentDays: dashData.absentDays || 0,
      });

      setTodayStatus(todayData);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
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

  const statusColor = {
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

        {/* Quick Check In/Out */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Today's Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {todayStatus ? (
              <div className="flex items-center gap-4">
                <div
                  className={`px-4 py-2 rounded-lg font-semibold capitalize ${
                    statusColor[todayStatus.status as keyof typeof statusColor] ||
                    'bg-gray-100 text-gray-800'
                  }`}
                >
                  {todayStatus.status}
                </div>
                <div className="text-sm text-gray-600">
                  {todayStatus.checkInTime && (
                    <p>Check-in: {new Date(todayStatus.checkInTime).toLocaleTimeString()}</p>
                  )}
                  {todayStatus.checkOutTime && (
                    <p>Check-out: {new Date(todayStatus.checkOutTime).toLocaleTimeString()}</p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-gray-600">No check-in yet today</p>
            )}
            <div className="flex gap-2">
              <button
                onClick={handleCheckIn}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition"
              >
                ✓ Check In
              </button>
              <button
                onClick={handleCheckOut}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition"
              >
                ✓ Check Out
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-semibold">Total Hours (This Month)</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">{stats.totalHours}</p>
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

        {/* Quick Links */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
