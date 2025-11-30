import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import Layout from '../../components/Layout';
import api from '../../services/api';
import { Attendance } from '../../types';

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

interface AttendanceMap {
  [key: string]: Attendance;
}

export default function AttendanceHistory() {
  const [date, setDate] = useState<Value>(new Date());
  const [attendanceData, setAttendanceData] = useState<Attendance[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<AttendanceMap>({});
  const [selectedDate, setSelectedDate] = useState<Attendance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchAttendanceHistory();
  }, [month, year]);

  const fetchAttendanceHistory = async () => {
    try {
      setLoading(true);
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0);

      const data = await api.getMyHistory(
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );

      setAttendanceData(data);

      // Create a map for quick lookup
      const map: AttendanceMap = {};
      data.forEach((record) => {
        const dateStr = new Date(record.date).toISOString().split('T')[0];
        map[dateStr] = record;
      });
      setAttendanceMap(map);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to load attendance history');
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

  const getTileClassName = ({ date: tileDate }: { date: Date }) => {
    const dateStr = tileDate.toISOString().split('T')[0];
    const record = attendanceMap[dateStr];

    if (record) {
      return `${getStatusColor(record.status)} text-white font-bold`;
    }
    return '';
  };

  const handleDateChange = (value: Value) => {
    if (value instanceof Date) {
      setDate(value);
      const dateStr = value.toISOString().split('T')[0];
      setSelectedDate(attendanceMap[dateStr] || null);
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
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

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
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  →
                </button>
              </div>
              <Calendar
                value={date}
                onChange={handleDateChange}
                tileClassName={getTileClassName}
                activeStartDate={new Date(year, month)}
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
            </div>
          </div>

          {/* Details */}
          <div className="lg:col-span-2">
            {selectedDate ? (
              <div className="bg-white rounded-lg shadow p-6 space-y-4">
                <h3 className="text-xl font-bold text-gray-800">
                  {new Date(selectedDate.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </h3>

                <div
                  className={`px-4 py-2 rounded-lg font-semibold inline-block capitalize ${
                    selectedDate.status === 'present'
                      ? 'bg-green-100 text-green-800'
                      : selectedDate.status === 'absent'
                        ? 'bg-red-100 text-red-800'
                        : selectedDate.status === 'late'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-orange-100 text-orange-800'
                  }`}
                >
                  {selectedDate.status}
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-gray-600 text-sm font-semibold">Check-in Time</p>
                    <p className="text-2xl font-bold text-blue-600 mt-2">
                      {selectedDate.checkInTime
                        ? new Date(selectedDate.checkInTime).toLocaleTimeString()
                        : '-'}
                    </p>
                  </div>

                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-gray-600 text-sm font-semibold">Check-out Time</p>
                    <p className="text-2xl font-bold text-green-600 mt-2">
                      {selectedDate.checkOutTime
                        ? new Date(selectedDate.checkOutTime).toLocaleTimeString()
                        : '-'}
                    </p>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-4">
                    <p className="text-gray-600 text-sm font-semibold">Total Hours</p>
                    <p className="text-2xl font-bold text-purple-600 mt-2">
                      {selectedDate.totalHours ? selectedDate.totalHours.toFixed(2) : '0'} h
                    </p>
                  </div>

                  <div className="bg-indigo-50 rounded-lg p-4">
                    <p className="text-gray-600 text-sm font-semibold">Date</p>
                    <p className="text-lg font-bold text-indigo-600 mt-2">
                      {new Date(selectedDate.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <p className="text-gray-600">Select a date to view details</p>
              </div>
            )}

            {/* Summary Stats */}
            <div className="bg-white rounded-lg shadow p-6 mt-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Month Summary</h3>
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
                    .reduce((sum, a) => sum + (a.totalHours || 0), 0)
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
