import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../services/api';

interface EmployeeReport {
  employeeId: string;
  name: string;
  email: string;
  department: string;
  totalHours: number;
  presentDays: number;
  lateDays: number;
  halfDays: number;
  absentDays: number;
}

export default function Reports() {
  const [reports, setReports] = useState<EmployeeReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<EmployeeReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'hours' | 'present'>('name');
  const [employees, setEmployees] = useState<{ id: string; name: string }[]>([]);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [reports, dateFrom, dateTo, selectedEmployee, sortBy]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const data = await api.getAllAttendances();

      // Group by employee
      const employeeMap = new Map<string, EmployeeReport>();

      data.forEach((record: any) => {
        const key = record.employeeId;
        if (!employeeMap.has(key)) {
          employeeMap.set(key, {
            employeeId: record.employeeId,
            name: record.employeeName || `Employee ${record.employeeId}`,
            email: record.email || '',
            department: record.department || '',
            totalHours: 0,
            presentDays: 0,
            lateDays: 0,
            halfDays: 0,
            absentDays: 0,
          });
        }

        const report = employeeMap.get(key)!;
        report.totalHours += record.totalHours || 0;

        if (record.status === 'present') report.presentDays++;
        else if (record.status === 'late') report.lateDays++;
        else if (record.status === 'half-day') report.halfDays++;
        else if (record.status === 'absent') report.absentDays++;
      });

      const reportsList = Array.from(employeeMap.values());
      setReports(reportsList);

      // Extract unique employees for filter dropdown
      setEmployees(
        reportsList.map((r) => ({ id: r.employeeId, name: r.name }))
      );

      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...reports];

    if (selectedEmployee) {
      filtered = filtered.filter((report) => report.employeeId === selectedEmployee);
    }

    // Sort
    if (sortBy === 'name') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'hours') {
      filtered.sort((a, b) => b.totalHours - a.totalHours);
    } else if (sortBy === 'present') {
      filtered.sort((a, b) => b.presentDays - a.presentDays);
    }

    setFilteredReports(filtered);
  };

  const handleExportCsv = async () => {
    try {
      setExporting(true);
      await api.exportCsv();
      setError('');
    } catch (err: any) {
      setError(err.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <Layout role="manager">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading reports...</p>
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

        {/* Controls */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Generate Reports</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Employee
              </label>
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="">All Employees</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="name">Name</option>
                <option value="hours">Total Hours</option>
                <option value="present">Present Days</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSelectedEmployee('');
                  setSortBy('name');
                }}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition"
              >
                Reset
              </button>
              <button
                onClick={handleExportCsv}
                disabled={exporting}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg transition"
              >
                {exporting ? 'Exporting...' : '📥 Export CSV'}
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-gray-600 text-sm font-semibold">Total Employees</p>
            <p className="text-2xl font-bold text-blue-600 mt-2">{filteredReports.length}</p>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-gray-600 text-sm font-semibold">Avg Present Days</p>
            <p className="text-2xl font-bold text-green-600 mt-2">
              {filteredReports.length > 0
                ? (
                    filteredReports.reduce((sum, r) => sum + r.presentDays, 0) /
                    filteredReports.length
                  ).toFixed(1)
                : '0'}
            </p>
          </div>

          <div className="bg-yellow-50 rounded-lg p-4">
            <p className="text-gray-600 text-sm font-semibold">Avg Total Hours</p>
            <p className="text-2xl font-bold text-yellow-600 mt-2">
              {filteredReports.length > 0
                ? (
                    filteredReports.reduce((sum, r) => sum + r.totalHours, 0) /
                    filteredReports.length
                  ).toFixed(1)
                : '0'}
            </p>
          </div>

          <div className="bg-red-50 rounded-lg p-4">
            <p className="text-gray-600 text-sm font-semibold">Avg Absent Days</p>
            <p className="text-2xl font-bold text-red-600 mt-2">
              {filteredReports.length > 0
                ? (
                    filteredReports.reduce((sum, r) => sum + r.absentDays, 0) /
                    filteredReports.length
                  ).toFixed(1)
                : '0'}
            </p>
          </div>
        </div>

        {/* Reports Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Department
                  </th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                    Total Hours
                  </th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                    Present
                  </th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                    Late
                  </th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                    Half Day
                  </th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                    Absent
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.length > 0 ? (
                  filteredReports.map((report) => (
                    <tr key={report.employeeId} className="border-t hover:bg-gray-50">
                      <td className="px-6 py-3 text-sm font-semibold text-gray-800">
                        {report.name}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-600">{report.department}</td>
                      <td className="px-6 py-3 text-center text-sm font-bold text-blue-600">
                        {report.totalHours.toFixed(1)} h
                      </td>
                      <td className="px-6 py-3 text-center">
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                          {report.presentDays}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-center">
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold">
                          {report.lateDays}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-center">
                        <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-semibold">
                          {report.halfDays}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-center">
                        <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold">
                          {report.absentDays}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-600">
                      No reports found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
