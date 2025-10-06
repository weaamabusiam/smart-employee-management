import axios from 'axios';

const API_URL = 'http://localhost:3000/api'; // Update if your backend runs elsewhere

// Employee API
export const getEmployees = async () => {
  console.log('Making API call to /employees with headers:', axios.defaults.headers.common);
  const res = await axios.get(`${API_URL}/employees`);
  return res.data;
};

export const createEmployee = async (data) => {
  const res = await axios.post(`${API_URL}/employees`, data);
  return res.data;
};

export const updateEmployee = async (id, data) => {
  const res = await axios.put(`${API_URL}/employees/${id}`, data);
  return res.data;
};

export const deleteEmployee = async (id) => {
  const res = await axios.delete(`${API_URL}/employees/${id}`);
  return res.data;
};

// Attendance API
export const getAttendance = async () => {
  const res = await axios.get(`${API_URL}/attendance`);
  return res.data;
};

export const getAttendanceReport = async (params = {}) => {
  const res = await axios.get(`${API_URL}/attendance/report`, { params });
  return res.data;
};

export const getEmployeeMonthlyPresence = async (employeeCode, year, month) => {
  const res = await axios.get(`${API_URL}/attendance/employee/${employeeCode}/monthly-presence`, {
    params: { year, month }
  });
  return res.data;
};

// User API
export const getUsers = async () => {
  const res = await axios.get(`${API_URL}/users`);
  return res.data;
};

export const createUser = async (data) => {
  const res = await axios.post(`${API_URL}/users`, data);
  return res.data;
};

export const updateUser = async (id, data) => {
  const res = await axios.put(`${API_URL}/users/${id}`, data);
  return res.data;
};

export const deleteUser = async (id) => {
  const res = await axios.delete(`${API_URL}/users/${id}`);
  return res.data;
};

// Department API
export const getDepartments = async () => {
  const res = await axios.get(`${API_URL}/departments`);
  return res.data;
};

export const createDepartment = async (data) => {
  const res = await axios.post(`${API_URL}/departments`, data);
  return res.data;
};

export const updateDepartment = async (id, data) => {
  const res = await axios.put(`${API_URL}/departments/${id}`, data);
  return res.data;
};

export const deleteDepartment = async (id) => {
  const res = await axios.delete(`${API_URL}/departments/${id}`);
  return res.data;
};

export const getAvailableManagers = async () => {
  const res = await axios.get(`${API_URL}/departments/available-managers`);
  return res.data;
};

export const updateDepartmentManager = async (departmentId, managerId) => {
  const res = await axios.put(`${API_URL}/departments/${departmentId}/manager`, { manager_id: managerId });
  return res.data;
};

// Auth API
export const login = async (username, password) => {
  const res = await axios.post(`${API_URL}/auth/login`, { username, password });
  return res.data;
};

export const getCurrentUser = async () => {
  const res = await axios.get(`${API_URL}/auth/me`);
  return res.data;
};

// ESP32 Devices API
export const getEsp32Devices = async () => {
  const res = await axios.get(`${API_URL}/esp32/devices`);
  return res.data;
};

export const createEsp32Device = async (data) => {
  const res = await axios.post(`${API_URL}/esp32/register`, data);
  return res.data;
};

export const updateEsp32Device = async (id, data) => {
  const res = await axios.put(`${API_URL}/esp32/devices/${id}`, data);
  return res.data;
};

export const deleteEsp32Device = async (id) => {
  const res = await axios.delete(`${API_URL}/esp32/devices/${id}`);
  return res.data;
};

// Add auth token to requests
export const setAuthToken = (token) => {
  console.log('Setting auth token:', token ? 'Token set' : 'Token cleared');
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }
};

