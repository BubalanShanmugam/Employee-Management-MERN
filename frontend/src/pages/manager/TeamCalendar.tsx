import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../services/api';

interface EmployeeStatus {
  employeeId: string;
  name: string;
  status: string;
  date: string;
  department: string;
}

interface DateAttendance {
  [key: string]: {
    [key: string]: string; // employeeId -> status
  };
}

export default function TeamCalendar() {
  const [attendanceData, setAttendanceData] = useState<EmployeeStatus[]>([]);
  const [dateAttendance, setDateAttendance] = useState<DateAttendance>({});
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());
  const [selectedDept, setSelectedDept] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const departments = ['Engineering', 'Sales', 'HR', 'Marketing', 'Finance'];

  useEffect(() => {
    fetchTeamAttendance();
  }, [month, year, selectedDept]);

  const fetchTeamAttendance = async () => {
    try {
      setLoading(true);
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0);

      const data = await api.getAllAttendances();

      // Filter by date range
      let filtered = data.filter((record: any) => {
        const recordDate = new Date(record.date);
        return recordDate >= startDate && recordDate <= endDate;
      });

      // Filter by department if selected
      if (selectedDept) {
        filtered = filtered.filter((record: any) => record.department === selectedDept);
      }

      setAttendanceData(filtered);

      // Build date-based attendance map
      const dateMap: DateAttendance = {};
      filtered.forEach((record: any) => {
        const dateStr = new Date(record.date).toISOString().split('T')[0];
        if (!dateMap[dateStr]) {
          dateMap[dateStr] = {};
        }
        dateMap[dateStr][record.employeeId] = record.status;
      });

      setDateAttendance(dateMap);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to load team attendance');
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (m: number, y: number) => {
    return new Date(y, m + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (m: number, y: number) => {
    return new Date(y, m, 1).getDay();
  };

  const getStatusColor = (status: string) => {
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

  const daysInMonth = getDaysInMonth(month, year);
  const firstDay = getFirstDayOfMonth(month, year);
  const calendarDays = Array.from({ length: firstDay }).fill(null);
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  const getUniqueEmployees = () => {
    const employees = new Map<string, { id: string; name: string; dept: string }>();
    attendanceData.forEach((record: any) => {
      if (!employees.has(record.employeeId)) {
        employees.set(record.employeeId, {
          id: record.employeeId,
          name: record.employeeName || `Employee ${record.employeeId}`,
          dept: record.department,
        });
      }
    });
    return Array.from(employees.values());
  };

  if (loading) {
    return (
      <Layout role="manager">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading team calendar...</p>
          </div>
        </div>
      </Layout>
    );
  }

  const employees = getUniqueEmployees();

  return (
    <Layout role="manager">
      <div className="space-y-6">
        {error && (
          <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Controls */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800">Team Calendar</h3>
            <div className="flex gap-4 items-center">
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>

              <button
                onClick={handlePrevMonth}
                className="p-2 hover:bg-gray-100 rounded font-bold"
              >
                ←
              </button>
              <span className="font-bold text-gray-800 min-w-48 text-center">
                {new Date(year, month).toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
              <button
                onClick={handleNextMonth}
                className="p-2 hover:bg-gray-100 rounded font-bold"
              >
                →
              </button>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>Present</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded"></div>
              <span>Late</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded"></div>
              <span>Half Day</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span>Absent</span>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Employee
                  </th>
                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => (
                    <th
                      key={day}
                      className="px-2 py-2 text-center text-xs font-semibold text-gray-700 min-w-10"
                    >
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {employees.length > 0 ? (
                  employees.map((employee) => (
                    <tr key={employee.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-semibold text-gray-800 sticky left-0 bg-white">
                        <div>{employee.name}</div>
                        <div className="text-xs text-gray-500">{employee.dept}</div>
                      </td>
                      {Array.from({ length: daysInMonth }, (_, i) => {
                        const day = i + 1;
                        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const status = dateAttendance[dateStr]?.[employee.id];
                        return (
                          <td key={`${employee.id}-${day}`} className="px-2 py-2 text-center">
                            {status ? (
                              <span
                                className={`inline-block px-2 py-1 rounded text-xs font-semibold capitalize ${getStatusColor(status)}`}
                              >
                                {status === 'half-day' ? 'HF' : status.charAt(0).toUpperCase()}
                              </span>
                            ) : (
                              <span className="text-gray-300 text-sm">-</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={daysInMonth + 1}
                      className="px-4 py-8 text-center text-gray-600"
                    >
                      No attendance data found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary Stats */}
        {employees.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Month Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-green-50 rounded p-4 text-center">
                <p className="text-gray-600 text-sm">Total Present</p>
                <p className="text-2xl font-bold text-green-600">
                  {attendanceData.filter((a) => a.status === 'present').length}
                </p>
              </div>
              <div className="bg-yellow-50 rounded p-4 text-center">
                <p className="text-gray-600 text-sm">Total Late</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {attendanceData.filter((a) => a.status === 'late').length}
                </p>
              </div>
              <div className="bg-orange-50 rounded p-4 text-center">
                <p className="text-gray-600 text-sm">Total Half Days</p>
                <p className="text-2xl font-bold text-orange-600">
                  {attendanceData.filter((a) => a.status === 'half-day').length}
                </p>
              </div>
              <div className="bg-red-50 rounded p-4 text-center">
                <p className="text-gray-600 text-sm">Total Absent</p>
                <p className="text-2xl font-bold text-red-600">
                  {attendanceData.filter((a) => a.status === 'absent').length}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
