import axios, { AxiosInstance } from 'axios';
import { LoginRequest, LoginResponse, RegisterRequest, User } from '../types';

const API_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:3000/api';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add token to every request if available
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  // Auth
  async register(data: RegisterRequest) {
    const response = await this.client.post('/auth/register', data);
    return response.data;
  }

  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await this.client.post<LoginResponse>('/auth/login', data);
    return response.data;
  }

  async getMe(): Promise<User> {
    const response = await this.client.get<{ user: User }>('/auth/me');
    return response.data.user;
  }

  // Employee Attendance
  async checkin() {
    const response = await this.client.post('/attendance/checkin');
    return response.data.record || response.data.data || response.data;
  }

  async checkout() {
    const response = await this.client.post('/attendance/checkout');
    return response.data.record || response.data.data || response.data;
  }

  async getMyHistory(startDate?: string, endDate?: string) {
    const params: any = {};
    if (startDate) params.start = startDate;
    if (endDate) params.end = endDate;
    const response = await this.client.get('/attendance/my-history', { params });
    return response.data.data || response.data;
  }

  async getMySummary(period = 'monthly') {
    const response = await this.client.get('/attendance/my-summary', { params: { period } });
    return response.data.data || response.data;
  }

  async getTodayStatus() {
    const response = await this.client.get('/attendance/today');
    return response.data.data || response.data;
  }

  // Manager Attendance
  async getAllAttendances(params?: any) {
    const response = await this.client.get('/attendance/all', { params });
    return response.data.data || response.data;
  }

  async getEmployeeAttendances(employeeId: string, params?: any) {
    const response = await this.client.get(`/attendance/employee/${employeeId}`, { params });
    return response.data.data || response.data;
  }

  async getTeamSummary(period = 'monthly') {
    const response = await this.client.get('/attendance/summary', { params: { period } });
    return response.data.summary || response.data.data || response.data;
  }

  async getTodayTeamStatus(department?: string) {
    const params = department ? { department } : {};
    const response = await this.client.get('/attendance/today-status', { params });
    return response.data.present || response.data.data || response.data;
  }

  async exportCsv(params?: any): Promise<Blob> {
    const response = await this.client.get('/attendance/export', {
      params,
      responseType: 'blob',
    });
    return response.data;
  }

  // Dashboard
  async getEmployeeDashboard() {
    const response = await this.client.get('/dashboard/employee');
    return response.data.data || response.data;
  }

  async getManagerDashboard() {
    const response = await this.client.get('/dashboard/manager');
    return response.data.data || response.data;
  }
}

export default new ApiService();
