import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../services/api';

interface TodayStatus {
  status: string;
  checkInTime?: string;
  checkOutTime?: string;
  totalHours?: number;
}

export default function MarkAttendance() {
  const [todayStatus, setTodayStatus] = useState<TodayStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchTodayStatus();
  }, []);

  const fetchTodayStatus = async () => {
    try {
      setLoading(true);
      const data = await api.getTodayStatus();
      setTodayStatus(data);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to load status');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    try {
      setLoading(true);
      await api.checkin();
      setSuccess('Check-in recorded successfully!');
      await fetchTodayStatus();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Check-in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    try {
      setLoading(true);
      await api.checkout();
      setSuccess('Check-out recorded successfully!');
      await fetchTodayStatus();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Check-out failed');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !todayStatus) {
    return (
      <Layout role="employee">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading attendance status...</p>
          </div>
        </div>
      </Layout>
    );
  }

  const statusColor = {
    'present': 'bg-green-100 text-green-800 border-green-300',
    'absent': 'bg-red-100 text-red-800 border-red-300',
    'late': 'bg-yellow-100 text-yellow-800 border-yellow-300',
    'half-day': 'bg-orange-100 text-orange-800 border-orange-300',
  };

  return (
    <Layout role="employee">
      <div className="max-w-2xl mx-auto space-y-6">
        {error && (
          <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
            {success}
          </div>
        )}

        {/* Current Status */}
        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Today's Attendance</h2>

          {todayStatus ? (
            <div className="space-y-6">
              {/* Status Badge */}
              <div className="flex items-center justify-center">
                <div
                  className={`px-8 py-4 rounded-lg font-bold text-lg capitalize border-2 ${
                    statusColor[todayStatus.status as keyof typeof statusColor] ||
                    'bg-gray-100 text-gray-800 border-gray-300'
                  }`}
                >
                  {todayStatus.status}
                </div>
              </div>

              {/* Time Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <p className="text-gray-600 text-sm font-semibold">Check-in Time</p>
                  <p className="text-2xl font-bold text-blue-600 mt-2">
                    {todayStatus.checkInTime
                      ? new Date(todayStatus.checkInTime).toLocaleTimeString()
                      : 'Not checked in'}
                  </p>
                </div>

                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <p className="text-gray-600 text-sm font-semibold">Check-out Time</p>
                  <p className="text-2xl font-bold text-green-600 mt-2">
                    {todayStatus.checkOutTime
                      ? new Date(todayStatus.checkOutTime).toLocaleTimeString()
                      : 'Not checked out'}
                  </p>
                </div>

                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <p className="text-gray-600 text-sm font-semibold">Total Hours</p>
                  <p className="text-2xl font-bold text-purple-600 mt-2">
                    {todayStatus.totalHours ? todayStatus.totalHours.toFixed(2) : '0'} h
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  onClick={handleCheckIn}
                  disabled={!!todayStatus.checkInTime || loading}
                  className={`flex-1 font-bold py-3 px-4 rounded-lg transition text-white ${
                    todayStatus.checkInTime
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {loading ? 'Processing...' : '✓ Check In'}
                </button>
                <button
                  onClick={handleCheckOut}
                  disabled={!todayStatus.checkInTime || !!todayStatus.checkOutTime || loading}
                  className={`flex-1 font-bold py-3 px-4 rounded-lg transition text-white ${
                    !todayStatus.checkInTime || todayStatus.checkOutTime
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {loading ? 'Processing...' : '✓ Check Out'}
                </button>
              </div>

              <div className="text-sm text-gray-600 bg-gray-50 rounded p-4">
                <p>
                  <strong>Note:</strong> You can only check in once per day. If you check out and
                  need to check in again, please contact your manager.
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-6">No attendance record found for today.</p>
              <button
                onClick={handleCheckIn}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg transition"
              >
                ✓ Check In Now
              </button>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-bold text-blue-900 mb-3">📋 Instructions</h3>
          <ul className="text-blue-800 space-y-2 text-sm">
            <li>• Click "Check In" when you arrive at work</li>
            <li>• Click "Check Out" when you leave the office</li>
            <li>• Late arrivals (after 9:00 AM) will be marked as "late"</li>
            <li>• Early departures (before 5:00 PM) will be marked as "half-day"</li>
            <li>• Your attendance status updates in real-time</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
}
