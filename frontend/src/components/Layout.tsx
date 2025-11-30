import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
  role: 'employee' | 'manager';
}

export default function Layout({ children, role }: LayoutProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const employeeLinks = [
    { label: 'Dashboard', path: '/employee/dashboard' },
    { label: 'Mark Attendance', path: '/employee/mark-attendance' },
    { label: 'Attendance History', path: '/employee/history' },
    { label: 'Profile', path: '/employee/profile' },
  ];

  const managerLinks = [
    { label: 'Dashboard', path: '/manager/dashboard' },
    { label: 'All Attendance', path: '/manager/all-attendance' },
    { label: 'Team Calendar', path: '/manager/team-calendar' },
    { label: 'Reports', path: '/manager/reports' },
  ];

  const navLinks = role === 'employee' ? employeeLinks : managerLinks;

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-gray-900 text-white transition-all duration-300 flex flex-col`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          {sidebarOpen && <h1 className="text-xl font-bold">EMS</h1>}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 hover:bg-gray-800 rounded"
          >
            {sidebarOpen ? '✕' : '≡'}
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {navLinks.map((link) => (
            <button
              key={link.path}
              onClick={() => navigate(link.path)}
              className="w-full text-left px-4 py-2 rounded hover:bg-gray-800 transition text-sm"
            >
              {sidebarOpen ? link.label : link.label.charAt(0)}
            </button>
          ))}
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-gray-700 space-y-2">
          {sidebarOpen && (
            <>
              <p className="text-xs text-gray-400">Logged in as</p>
              <p className="text-sm font-semibold truncate">{user?.name}</p>
              <p className="text-xs text-gray-400 capitalize">{role}</p>
            </>
          )}
          <button
            onClick={handleLogout}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded text-sm transition"
          >
            {sidebarOpen ? 'Logout' : 'Out'}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow p-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              {role === 'employee' ? 'Employee Dashboard' : 'Manager Dashboard'}
            </h2>
            <p className="text-gray-600 text-sm">Welcome back, {user?.name}</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-700 text-sm">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
