import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import EmployeeDashboard from './pages/employee/Dashboard';
import MarkAttendance from './pages/employee/MarkAttendance';
import AttendanceHistory from './pages/employee/AttendanceHistory';
import EmployeeProfile from './pages/employee/Profile';
import ManagerDashboard from './pages/manager/Dashboard';
import AllAttendance from './pages/manager/AllAttendance';
import TeamCalendar from './pages/manager/TeamCalendar';
import Reports from './pages/manager/Reports';

interface PrivateRouteProps {
  children: React.ReactNode;
  allowedRole?: 'employee' | 'manager';
}

const PrivateRoute = ({ children, allowedRole }: PrivateRouteProps) => {
  const { user, token } = useAuth();

  if (!token) return <Navigate to="/login" />;
  if (allowedRole && user?.role !== allowedRole) return <Navigate to="/login" />;

  return <>{children}</>;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Employee Routes */}
      <Route
        path="/employee/dashboard"
        element={
          <PrivateRoute allowedRole="employee">
            <EmployeeDashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/employee/mark-attendance"
        element={
          <PrivateRoute allowedRole="employee">
            <MarkAttendance />
          </PrivateRoute>
        }
      />
      <Route
        path="/employee/history"
        element={
          <PrivateRoute allowedRole="employee">
            <AttendanceHistory />
          </PrivateRoute>
        }
      />
      <Route
        path="/employee/profile"
        element={
          <PrivateRoute allowedRole="employee">
            <EmployeeProfile />
          </PrivateRoute>
        }
      />

      {/* Manager Routes */}
      <Route
        path="/manager/dashboard"
        element={
          <PrivateRoute allowedRole="manager">
            <ManagerDashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/manager/all-attendance"
        element={
          <PrivateRoute allowedRole="manager">
            <AllAttendance />
          </PrivateRoute>
        }
      />
      <Route
        path="/manager/team-calendar"
        element={
          <PrivateRoute allowedRole="manager">
            <TeamCalendar />
          </PrivateRoute>
        }
      />
      <Route
        path="/manager/reports"
        element={
          <PrivateRoute allowedRole="manager">
            <Reports />
          </PrivateRoute>
        }
      />

      <Route path="/" element={<Navigate to="/login" />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
