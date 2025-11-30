export interface User {
  id: string;
  name: string;
  email: string;
  role: 'employee' | 'manager';
  employeeId: string;
  department: string;
  createdAt: string;
}

export interface Attendance {
  id: string;
  userId: string;
  date: string;
  checkInTime?: string;
  checkOutTime?: string;
  status: 'present' | 'absent' | 'late' | 'half-day';
  totalHours: number;
  createdAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  loginAs?: 'employee' | 'manager';
}

export interface LoginResponse {
  message: string;
  token: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  employeeId: string;
  department: string;
  role?: 'employee' | 'manager';
}

export interface ApiResponse<T> {
  message: string;
  data?: T;
  token?: string;
  user?: T;
}
