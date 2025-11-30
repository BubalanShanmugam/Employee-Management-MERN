import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../services/api';

interface Session {
  id: string;
  sessionNumber: number;
  checkInTime?: string;
  checkOutTime?: string;
  totalHours?: number;
  status: string;
}

interface TodayStatus {
  status: string;
  checkInTime?: string;
  checkOutTime?: string;
  totalHours?: number;
  totalHoursToday?: number;
  sessionsCount?: number;
  sessionNumber?: number;
  allSessions?: Session[];
}

interface DayData {
  date: string;
  dayName: string;
  sessions: Session[];
  totalHours: number;
  sessionsCount: number;
  status: string;
}

export default function MarkAttendance() {
  const [todayStatus, setTodayStatus] = useState<TodayStatus | null>(null);
  const [last7Days, setLast7Days] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [todayResponse, last7Response] = await Promise.all([
        api.getTodayStatus(),
        api.getLast7Days()
      ]);
      const data = todayResponse && typeof todayResponse === 'object' ? todayResponse : null;
      setTodayStatus(data);
      setLast7Days(Array.isArray(last7Response) ? last7Response : []);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to load status');
    } finally {
      setLoading(false);
    }
  };

  const fetchTodayStatus = async () => {
    try {
      const response = await api.getTodayStatus();
      const data = response && typeof response === 'object' ? response : null;
      setTodayStatus(data);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to load status');
    }
  };

  const handleCheckIn = async () => {
    try {
      setLoading(true);
      setError('');
      await api.checkin();
      setSuccess('Check-in recorded successfully!');
      await fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Check-in failed';
      setError(errorMessage);
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    try {
      setLoading(true);
      setError('');
      await api.checkout();
      setSuccess('Check-out recorded successfully!');
      await fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Check-out failed';
      setError(errorMessage);
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  // Determine if user can check in (no active session or last session is checked out)
  const canCheckIn = !todayStatus || (todayStatus.checkOutTime !== null && todayStatus.checkOutTime !== undefined);
  
  // Determine if user can check out (has an active session with check-in but no check-out)
  const canCheckOut = todayStatus && todayStatus.checkInTime && !todayStatus.checkOutTime;

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

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <Layout role="employee">
      <div className="max-w-4xl mx-auto space-y-6">
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
              <div className="flex items-center justify-center gap-4">
                <div
                  className={`px-8 py-4 rounded-lg font-bold text-lg capitalize border-2 ${
                    statusColor[todayStatus.status as keyof typeof statusColor] ||
                    'bg-gray-100 text-gray-800 border-gray-300'
                  }`}
                >
                  {todayStatus.status}
                </div>
                {todayStatus.sessionsCount && todayStatus.sessionsCount > 0 && (
                  <div className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium">
                    Session {todayStatus.sessionNumber} of {todayStatus.sessionsCount}
                  </div>
                )}
              </div>

              {/* Time Details */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <p className="text-gray-600 text-sm font-semibold">Current Session Check-in</p>
                  <p className="text-xl font-bold text-blue-600 mt-2">
                    {todayStatus.checkInTime
                      ? new Date(todayStatus.checkInTime).toLocaleTimeString()
                      : 'Not checked in'}
                  </p>
                </div>

                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <p className="text-gray-600 text-sm font-semibold">Current Session Check-out</p>
                  <p className="text-xl font-bold text-green-600 mt-2">
                    {todayStatus.checkOutTime
                      ? new Date(todayStatus.checkOutTime).toLocaleTimeString()
                      : 'Not checked out'}
                  </p>
                </div>

                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <p className="text-gray-600 text-sm font-semibold">Session Hours</p>
                  <p className="text-xl font-bold text-purple-600 mt-2">
                    {todayStatus.totalHours ? todayStatus.totalHours.toFixed(2) : '0'} h
                  </p>
                </div>

                <div className="bg-indigo-50 rounded-lg p-4 text-center">
                  <p className="text-gray-600 text-sm font-semibold">Total Hours Today</p>
                  <p className="text-xl font-bold text-indigo-600 mt-2">
                    {todayStatus.totalHoursToday ? todayStatus.totalHoursToday.toFixed(2) : (todayStatus.totalHours ? todayStatus.totalHours.toFixed(2) : '0')} h
                  </p>
                </div>
              </div>

              {/* All Sessions Today */}
              {todayStatus.allSessions && todayStatus.allSessions.length > 1 && (
                <div className="mt-4">
                  <h3 className="text-lg font-semibold text-gray-700 mb-3">All Sessions Today</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-gray-50 rounded-lg">
                      <thead>
                        <tr className="text-gray-600 text-sm">
                          <th className="py-2 px-4 text-left">Session</th>
                          <th className="py-2 px-4 text-left">Check-in</th>
                          <th className="py-2 px-4 text-left">Check-out</th>
                          <th className="py-2 px-4 text-left">Hours</th>
                          <th className="py-2 px-4 text-left">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {todayStatus.allSessions.map((session) => (
                          <tr key={session.id} className="border-t border-gray-200">
                            <td className="py-2 px-4 font-medium">#{session.sessionNumber}</td>
                            <td className="py-2 px-4">
                              {session.checkInTime ? new Date(session.checkInTime).toLocaleTimeString() : '-'}
                            </td>
                            <td className="py-2 px-4">
                              {session.checkOutTime ? new Date(session.checkOutTime).toLocaleTimeString() : '-'}
                            </td>
                            <td className="py-2 px-4">{session.totalHours ? session.totalHours.toFixed(2) : '0'} h</td>
                            <td className="py-2 px-4">
                              <span className={`px-2 py-1 rounded text-xs capitalize ${
                                statusColor[session.status as keyof typeof statusColor] || 'bg-gray-100'
                              }`}>
                                {session.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  onClick={handleCheckIn}
                  disabled={!canCheckIn || loading}
                  className={`flex-1 font-bold py-3 px-4 rounded-lg transition text-white ${
                    !canCheckIn
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {loading ? 'Processing...' : '✓ Check In'}
                </button>
                <button
                  onClick={handleCheckOut}
                  disabled={!canCheckOut || loading}
                  className={`flex-1 font-bold py-3 px-4 rounded-lg transition text-white ${
                    !canCheckOut
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {loading ? 'Processing...' : '✓ Check Out'}
                </button>
              </div>

              <div className="text-sm text-gray-600 bg-gray-50 rounded p-4">
                <p>
                  <strong>Note:</strong> You can check in and out multiple times per day. Each session is tracked separately.
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-6">No attendance record found for today.</p>
              <button
                onClick={handleCheckIn}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg transition"
              >
                {loading ? 'Processing...' : '✓ Check In Now'}
              </button>
            </div>
          )}
        </div>

        {/* Last 7 Days Section */}
        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Last 7 Days</h2>
          
          {last7Days.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="py-3 px-4 text-left text-gray-600 font-semibold">Date</th>
                    <th className="py-3 px-4 text-left text-gray-600 font-semibold">Day</th>
                    <th className="py-3 px-4 text-left text-gray-600 font-semibold">Status</th>
                    <th className="py-3 px-4 text-left text-gray-600 font-semibold">Sessions</th>
                    <th className="py-3 px-4 text-left text-gray-600 font-semibold">Total Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {last7Days.map((day) => {
                    const isToday = new Date(day.date).toDateString() === new Date().toDateString();
                    return (
                      <tr key={day.date} className={`border-b border-gray-100 ${isToday ? 'bg-blue-50' : ''}`}>
                        <td className="py-3 px-4">
                          <span className="font-medium">{formatDate(day.date)}</span>
                          {isToday && <span className="ml-2 text-xs bg-blue-500 text-white px-2 py-1 rounded">Today</span>}
                        </td>
                        <td className="py-3 px-4 text-gray-600">{day.dayName}</td>
                        <td className="py-3 px-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${
                            statusColor[day.status as keyof typeof statusColor] || 'bg-gray-100 text-gray-800'
                          }`}>
                            {day.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-700">{day.sessionsCount}</td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-indigo-600">{day.totalHours.toFixed(2)} h</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No attendance records found for the last 7 days.
            </div>
          )}

          {/* Weekly Summary */}
          {last7Days.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-indigo-50 rounded-lg p-4 text-center">
                  <p className="text-gray-600 text-sm font-semibold">Total Hours (7 Days)</p>
                  <p className="text-2xl font-bold text-indigo-600 mt-2">
                    {last7Days.reduce((sum, day) => sum + day.totalHours, 0).toFixed(2)} h
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <p className="text-gray-600 text-sm font-semibold">Days Present</p>
                  <p className="text-2xl font-bold text-green-600 mt-2">
                    {last7Days.filter(day => day.status !== 'absent').length} / 7
                  </p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <p className="text-gray-600 text-sm font-semibold">Total Sessions</p>
                  <p className="text-2xl font-bold text-purple-600 mt-2">
                    {last7Days.reduce((sum, day) => sum + day.sessionsCount, 0)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-bold text-blue-900 mb-3">📋 Instructions</h3>
          <ul className="text-blue-800 space-y-2 text-sm">
            <li>• Click "Check In" when you arrive at work</li>
            <li>• Click "Check Out" when you leave the office</li>
            <li>• You can check in and out multiple times per day</li>
            <li>• Late arrivals (after 9:00 AM) will be marked as "late"</li>
            <li>• Your attendance status updates in real-time</li>
            <li>• View your last 7 days attendance summary below</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
}
