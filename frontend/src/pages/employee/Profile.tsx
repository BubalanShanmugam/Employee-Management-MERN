import React from 'react';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';

export default function Profile() {
  const { user } = useAuth();

  return (
    <Layout role="employee">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-8">My Profile</h2>

          {user ? (
            <div className="space-y-6">
              {/* Avatar */}
              <div className="flex justify-center">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-4xl font-bold text-white">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Full Name */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-600 text-sm font-semibold">Full Name</p>
                  <p className="text-lg font-bold text-gray-800 mt-2">{user.name}</p>
                </div>

                {/* Email */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-600 text-sm font-semibold">Email Address</p>
                  <p className="text-lg font-bold text-gray-800 mt-2">{user.email}</p>
                </div>

                {/* Role */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-600 text-sm font-semibold">Role</p>
                  <p className="text-lg font-bold text-blue-600 mt-2 capitalize">{user.role}</p>
                </div>

                {/* Employee ID */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-600 text-sm font-semibold">Employee ID</p>
                  <p className="text-lg font-bold text-gray-800 mt-2">{user.employeeId || 'N/A'}</p>
                </div>

                {/* Department */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-600 text-sm font-semibold">Department</p>
                  <p className="text-lg font-bold text-gray-800 mt-2">{user.department || 'N/A'}</p>
                </div>

                {/* User ID */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-600 text-sm font-semibold">User ID</p>
                  <p className="text-sm font-mono text-gray-600 mt-2 break-all">{user.id}</p>
                </div>
              </div>

              {/* Additional Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="font-bold text-blue-900 mb-3">📝 Account Information</h3>
                <ul className="text-blue-800 space-y-2 text-sm">
                  <li>• You are logged in as an Employee</li>
                  <li>• Your attendance is automatically tracked when you check in/out</li>
                  <li>• View your attendance history in the "Attendance History" section</li>
                  <li>• Contact your manager for any discrepancies or issues</li>
                  <li>• Your profile information is read-only and managed by your administrator</li>
                </ul>
              </div>

              {/* Security Info */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h3 className="font-bold text-yellow-900 mb-3">🔒 Security</h3>
                <p className="text-yellow-800 text-sm">
                  Your password is securely stored. If you suspect unauthorized access to your
                  account, please contact your system administrator immediately.
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600">User information not available</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
