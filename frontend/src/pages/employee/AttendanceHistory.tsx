import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import Layout from '../../components/Layout';
import api from '../../services/api';
import { Attendance } from '../../types';

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

interface AttendanceMap {
  [key: string]: Attendance[];
}

export default function AttendanceHistory() {
  const [date, setDate] = useState<Value>(new Date());
  const [attendanceData, setAttendanceData] = useState<Attendance[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<AttendanceMap>({});
  const [selectedDateRecords, setSelectedDateRecords] = useState<Attendance[]>([]);
  const [selectedDateStr, setSelectedDateStr] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());

  // Get today's date string for comparison
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  useEffect(() => {
    fetchAttendanceHistory();
  }, [month, year]);

  const fetchAttendanceHistory = async () => {
    try {
      setLoading(true);
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0);

      const startStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
      const endStr = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;

      const response = await api.getMyHistory(startStr, endStr);
      const data = Array.isArray(response) ? response : response.data || response;

      setAttendanceData(data);

      // Create a map for quick lookup - group by date for multiple sessions
      const map: AttendanceMap = {};
      data.forEach((record: Attendance) => {
        const dateStr = record.date ? record.date.substring(0, 10) : '';
        if (dateStr) {
          if (!map[dateStr]) {
            map[dateStr] = [];
          }
          map[dateStr].push(record);
        }
      });
      setAttendanceMap(map);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to load attendance history');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-green-500';
      case 'absent':
        return 'bg-red-500';
      case 'late':
        return 'bg-yellow-500';
      case 'half-day':
        return 'bg-orange-500';
      default:
        return 'bg-gray-300';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800';
      case 'absent':
        return 'bg-red-100 text-red-800';
      case 'late':
        return 'bg-yellow-100 text-yellow-800';
      case 'half-day':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTileClassName = ({ date: tileDate }: { date: Date }) => {
    const dateStr = `${tileDate.getFullYear()}-${String(tileDate.getMonth() + 1).padStart(2, '0')}-${String(tileDate.getDate()).padStart(2, '0')}`;
    const records = attendanceMap[dateStr];

    if (records && records.length > 0) {
      // Use the first record's status for the tile color
      return `${getStatusColor(records[0].status)} text-white font-bold`;
    }
    return '';
  };

  const handleDateChange = (value: Value) => {
    if (value instanceof Date) {
      setDate(value);
      const dateStr = `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
      setSelectedDateStr(dateStr);
      setSelectedDateRecords(attendanceMap[dateStr] || []);
    }
  };

  const handlePrevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const handleNextMonth = () => {
    // Don't allow navigating to future months
    const now = new Date();
    if (year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth())) {
      return;
    }
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  // Check if selected date is today
  const isSelectedDateToday = selectedDateStr === todayStr;
  
  // Check if selected date is in the past
  const isSelectedDatePast = selectedDateStr && selectedDateStr < todayStr;
  
  // Check if selected date is in the future
  const isSelectedDateFuture = selectedDateStr && selectedDateStr > todayStr;

  if (loading) {
    return (
      <Layout role="employee">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading attendance history...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout role="employee">
      <div className="max-w-6xl mx-auto space-y-6">
        {error && (
          <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={handlePrevMonth}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  ←
                </button>
                <h3 className="font-bold text-gray-800">
                  {new Date(year, month).toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </h3>
                <button
                  onClick={handleNextMonth}
                  disabled={year === today.getFullYear() && month >= today.getMonth()}
                  className={`p-2 rounded ${
                    year === today.getFullYear() && month >= today.getMonth()
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  →
                </button>
              </div>
              <Calendar
                value={date}
                onChange={handleDateChange}
                tileClassName={getTileClassName}
                activeStartDate={new Date(year, month)}
                maxDate={new Date()} // Disable future dates
                tileDisabled={({ date: tileDate }) => tileDate > new Date()} // Disable future date tiles
              />

              {/* Legend */}
              <div className="mt-6 space-y-2">
                <p className="font-semibold text-gray-700 text-sm">Legend:</p>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded"></div>
                    <span className="text-xs text-gray-600">Present</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                    <span className="text-xs text-gray-600">Late</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-orange-500 rounded"></div>
                    <span className="text-xs text-gray-600">Half Day</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded"></div>
                    <span className="text-xs text-gray-600">Absent</span>
                  </div>
                </div>
              </div>

              {/* Info Note */}
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-700">
                  📅 Click on a date to view attendance details. Attendance can only be marked for today.
                </p>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="lg:col-span-2">
            {selectedDateStr ? (
              <div className="bg-white rounded-lg shadow p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-800">
                    {new Date(selectedDateStr + 'T00:00:00').toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </h3>
                  {isSelectedDateToday && (
                    <span className="px-3 py-1 bg-blue-500 text-white text-sm font-medium rounded-full">
                      Today
                    </span>
                  )}
                  {isSelectedDatePast && (
                    <span className="px-3 py-1 bg-gray-400 text-white text-sm font-medium rounded-full">
                      Past Date (View Only)
                    </span>
                  )}
                </div>

                {selectedDateRecords.length > 0 ? (
                  <>
                    {/* Sessions Table */}
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="py-2 px-4 text-left text-sm font-semibold text-gray-700">Session</th>
                            <th className="py-2 px-4 text-left text-sm font-semibold text-gray-700">Check-in</th>
                            <th className="py-2 px-4 text-left text-sm font-semibold text-gray-700">Check-out</th>
                            <th className="py-2 px-4 text-left text-sm font-semibold text-gray-700">Hours</th>
                            <th className="py-2 px-4 text-left text-sm font-semibold text-gray-700">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedDateRecords.map((record, idx) => (
                            <tr key={record.id || idx} className="border-t border-gray-100">
                              <td className="py-3 px-4 font-medium">#{(record as any).session_number || (record as any).sessionNumber || idx + 1}</td>
                              <td className="py-3 px-4">
                                {(record as any).check_in_time || record.checkInTime
                                  ? new Date((record as any).check_in_time || record.checkInTime).toLocaleTimeString()
                                  : '-'}
                              </td>
                              <td className="py-3 px-4">
                                {(record as any).check_out_time || record.checkOutTime
                                  ? new Date((record as any).check_out_time || record.checkOutTime).toLocaleTimeString()
                                  : '-'}
                              </td>
                              <td className="py-3 px-4">
                                {((record as any).total_hours || record.totalHours || 0).toFixed(2)} h
                              </td>
                              <td className="py-3 px-4">
                                <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${getStatusBadgeColor(record.status)}`}>
                                  {record.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Day Summary */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4 pt-4 border-t">
                      <div className="bg-blue-50 rounded-lg p-4 text-center">
                        <p className="text-gray-600 text-sm font-semibold">Total Sessions</p>
                        <p className="text-2xl font-bold text-blue-600 mt-1">
                          {selectedDateRecords.length}
                        </p>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-4 text-center">
                        <p className="text-gray-600 text-sm font-semibold">Total Hours</p>
                        <p className="text-2xl font-bold text-purple-600 mt-1">
                          {selectedDateRecords.reduce((sum, r) => sum + ((r as any).total_hours || r.totalHours || 0), 0).toFixed(2)} h
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4 text-center">
                        <p className="text-gray-600 text-sm font-semibold">Status</p>
                        <p className={`text-lg font-bold mt-1 capitalize ${
                          selectedDateRecords[0].status === 'present' ? 'text-green-600' :
                          selectedDateRecords[0].status === 'late' ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {selectedDateRecords[0].status}
                        </p>
                      </div>
                    </div>

                    {/* Past Date Notice */}
                    {isSelectedDatePast && (
                      <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                        <p className="text-sm text-gray-600 text-center">
                          📋 This is a past date. Attendance records are view-only.
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8">
                    {isSelectedDatePast ? (
                      <div className="space-y-2">
                        <p className="text-gray-500 text-lg">No attendance record for this date</p>
                        <p className="text-sm text-gray-400">You were absent on this day or didn't mark attendance.</p>
                      </div>
                    ) : isSelectedDateToday ? (
                      <div className="space-y-4">
                        <p className="text-gray-500 text-lg">No attendance marked yet today</p>
                        <a 
                          href="/employee/mark-attendance" 
                          className="inline-block bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition"
                        >
                          Mark Attendance Now
                        </a>
                      </div>
                    ) : (
                      <p className="text-gray-500">No data available</p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <div className="py-12">
                  <p className="text-gray-500 text-lg">👆 Select a date from the calendar to view attendance details</p>
                </div>
              </div>
            )}

            {/* Summary Stats */}
            <div className="bg-white rounded-lg shadow p-6 mt-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                {new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} Summary
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 rounded p-4 text-center">
                  <p className="text-gray-600 text-sm">Present Days</p>
                  <p className="text-2xl font-bold text-green-600">
                    {attendanceData.filter((a) => a.status === 'present').length}
                  </p>
                </div>
                <div className="bg-yellow-50 rounded p-4 text-center">
                  <p className="text-gray-600 text-sm">Late Days</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {attendanceData.filter((a) => a.status === 'late').length}
                  </p>
                </div>
                <div className="bg-orange-50 rounded p-4 text-center">
                  <p className="text-gray-600 text-sm">Half Days</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {attendanceData.filter((a) => a.status === 'half-day').length}
                  </p>
                </div>
                <div className="bg-red-50 rounded p-4 text-center">
                  <p className="text-gray-600 text-sm">Absent Days</p>
                  <p className="text-2xl font-bold text-red-600">
                    {attendanceData.filter((a) => a.status === 'absent').length}
                  </p>
                </div>
              </div>
              <div className="mt-4 p-4 bg-purple-50 rounded">
                <p className="text-gray-600 text-sm">Total Hours This Month</p>
                <p className="text-2xl font-bold text-purple-600">
                  {attendanceData
                    .reduce((sum, a) => sum + ((a as any).total_hours || a.totalHours || 0), 0)
                    .toFixed(2)}{' '}
                  h
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
