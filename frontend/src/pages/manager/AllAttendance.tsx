import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../services/api';
import { Attendance } from '../../types';

interface AttendanceRecord extends Attendance {
  employeeName?: string;
  employeeEmail?: string;
  department?: string;
}

export default function AllAttendance() {
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [filteredData, setFilteredData] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    department: '',
    dateFrom: '',
    dateTo: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const departments = ['Engineering', 'Sales', 'HR', 'Marketing', 'Finance'];
  const statuses = ['present', 'absent', 'late', 'half-day'];

  useEffect(() => {
    fetchAttendanceData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [attendanceData, filters]);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      const response = await api.getAllAttendances();
      const data = Array.isArray(response) ? response : response.data || response;
      setAttendanceData(data);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...attendanceData];

    if (filters.status) {
      filtered = filtered.filter((record) => record.status === filters.status);
    }

    if (filters.department) {
      filtered = filtered.filter((record) => record.department === filters.department);
    }

    if (filters.dateFrom) {
      filtered = filtered.filter(
        (record) => new Date(record.date) >= new Date(filters.dateFrom)
      );
    }

    if (filters.dateTo) {
      filtered = filtered.filter(
        (record) => new Date(record.date) <= new Date(filters.dateTo)
      );
    }

    setFilteredData(filtered);
    setCurrentPage(1);
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters({ ...filters, [field]: value });
  };

  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  if (loading) {
    return (
      <Layout role="manager">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading attendance data...</p>
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

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Filter Records</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="">All Statuses</option>
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Department
              </label>
              <select
                value={filters.department}
                onChange={(e) => handleFilterChange('department', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Date From</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Date To</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={() =>
                  setFilters({
                    status: '',
                    department: '',
                    dateFrom: '',
                    dateTo: '',
                  })
                }
                className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-900 text-sm">
            <strong>Showing {paginatedData.length} of {filteredData.length}</strong> records
          </p>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Check-in
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Check-out
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Hours
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.length > 0 ? (
                  paginatedData.map((record, idx) => (
                    <tr key={idx} className="border-t hover:bg-gray-50">
                      <td className="px-6 py-3 text-sm text-gray-800">
                        {new Date(record.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-800">
                        {record.employeeName || 'Employee'}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-600">
                        {record.department || '-'}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-600">
                        {record.checkInTime
                          ? new Date(record.checkInTime).toLocaleTimeString()
                          : '-'}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-600">
                        {record.checkOutTime
                          ? new Date(record.checkOutTime).toLocaleTimeString()
                          : '-'}
                      </td>
                      <td className="px-6 py-3 text-sm font-semibold text-gray-800">
                        {record.totalHours ? record.totalHours.toFixed(2) : '0'} h
                      </td>
                      <td className="px-6 py-3 text-sm">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                            record.status === 'present'
                              ? 'bg-green-100 text-green-800'
                              : record.status === 'absent'
                                ? 'bg-red-100 text-red-800'
                                : record.status === 'late'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-orange-100 text-orange-800'
                          }`}
                        >
                          {record.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-600">
                      No records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-2 rounded-lg transition ${
                  currentPage === page
                    ? 'bg-blue-600 text-white'
                    : 'border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}
