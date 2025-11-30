import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  count: number;
}

interface TodayStatusEmployee {
  id: string;
  name: string;
  department: string;
  status: string;
  checkInTime?: string;
  checkOutTime?: string;
}

interface AbsentEmployee {
  id: string;
  name: string;
  department: string;
  employeeId?: string;
}

interface LateArrival {
  id: string;
  name: string;
  department: string;
  checkInTime: string;
}

export default function ManagerDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<ManagerStats>({
    totalEmployees: 0,
    presentToday: 0,
    absentToday: 0,
    lateToday: 0,
  });
  const [departmentData, setDepartmentData] = useState<DepartmentData[]>([]);
  const [todayStatusList, setTodayStatusList] = useState<TodayStatusEmployee[]>([]);
  const [absentEmployees, setAbsentEmployees] = useState<AbsentEmployee[]>([]);
  const [lateArrivals, setLateArrivals] = useState<LateArrival[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      const data = await api.getManagerDashboard();

      setStats({
        totalEmployees: data.totalEmployees || 0,
        presentToday: data.presentToday || 0,
        absentToday: data.absentToday || 0,
        lateToday: data.lateToday || 0,
      });

      setDepartmentData(data.departmentData || []);
      setTodayStatusList(data.todayStatusList || []);
      setAbsentEmployees(data.absentEmployees || []);
      setLateArrivals(data.lateArrivals || []);

    } catch (err: any) {
      console.error('Manager dashboard error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      const blob = await api.exportCsv();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance_${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
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

        {/* Key Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

        {/* Charts and Lists Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Department-wise Hours */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Department-wise Hours (This Month)</h3>
            {departmentData.length > 0 ? (
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
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                No data available
              </div>
            )}
          </div>

          {/* Late Arrivals Today */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Late Arrivals Today</h3>
            {lateArrivals.length > 0 ? (
              <div className="overflow-y-auto max-h-72">
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Employee</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Dept</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Check-in</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lateArrivals.map((emp, idx) => (
                      <tr key={idx} className="border-t hover:bg-yellow-50">
                        <td className="px-4 py-2 text-sm text-gray-800">{emp.name}</td>
                        <td className="px-4 py-2 text-sm text-gray-600">{emp.department}</td>
                        <td className="px-4 py-2 text-sm text-yellow-700 font-medium">
                          {new Date(emp.checkInTime).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-green-600">
                ✓ No late arrivals today
              </div>
            )}
          </div>
        </div>

        {/* Absent Employees */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            Absent Employees Today 
            <span className="ml-2 text-sm font-normal text-red-600">({absentEmployees.length})</span>
          </h3>
          {absentEmployees.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Employee</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Employee ID</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Department</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {absentEmployees.slice(0, 10).map((emp, idx) => (
                    <tr key={idx} className="border-t hover:bg-red-50">
                      <td className="px-4 py-3 text-sm text-gray-800">{emp.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{emp.employeeId || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{emp.department}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                          Absent
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {absentEmployees.length > 10 && (
                <p className="text-sm text-gray-500 mt-2 text-center">
                  And {absentEmployees.length - 10} more...
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-green-600">
              ✓ All employees are present today!
            </div>
          )}
        </div>

        {/* Today's Attendance Status */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Today's Attendance Status</h3>
          {todayStatusList.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Employee</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Department</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Status</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Check-in</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Check-out</th>
                  </tr>
                </thead>
                <tbody>
                  {todayStatusList.slice(0, 15).map((employee, idx) => (
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
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {employee.checkInTime ? new Date(employee.checkInTime).toLocaleTimeString() : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {employee.checkOutTime ? new Date(employee.checkOutTime).toLocaleTimeString() : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No attendance records for today yet
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button 
              onClick={() => navigate('/manager/all-attendance')}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition"
            >
              📊 All Attendance
            </button>
            <button 
              onClick={() => navigate('/manager/team-calendar')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition"
            >
              📅 Team Calendar
            </button>
            <button 
              onClick={() => navigate('/manager/reports')}
              className="bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 px-4 rounded-lg transition"
            >
              📈 Reports
            </button>
            <button 
              onClick={handleExportCsv}
              className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-4 rounded-lg transition"
            >
              📥 Export CSV
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
