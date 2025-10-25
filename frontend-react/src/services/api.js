import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: false, // Changed to false for token-based auth
});

// Add token to requests if it exists
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });
    
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  register: async (data) => {
    const response = await api.post('/register', data);
    return response.data;
  },

  login: async (credentials) => {
    const response = await api.post('/login', credentials);
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/logout');
    return response.data;
  },

  getUser: async () => {
    const response = await api.get('/user');
    return response.data;
  },
};

// Course API calls
export const courseAPI = {
  getAll: async () => {
    try {
      console.log('Fetching courses from:', `${API_URL}/courses`);
      const response = await api.get('/courses');
      console.log('Courses response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error in courseAPI.getAll:', error);
      throw error;
    }
  },

  getOne: async (id) => {
    const response = await api.get(`/courses/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/courses', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/courses/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/courses/${id}`);
    return response.data;
  },

  getStatistics: async () => {
    const response = await api.get('/courses/statistics/all');
    return response.data;
  },
};

// Module API calls
export const moduleAPI = {
  getByCourse: async (courseId) => {
    const response = await api.get(`/courses/${courseId}/modules`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/modules', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/modules/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/modules/${id}`);
    return response.data;
  },
};

// Assignment API calls
export const assignmentAPI = {
  getByCourse: async (courseId) => {
    const response = await api.get(`/courses/${courseId}/assignments`);
    return response.data;
  },

  getOne: async (id) => {
    const response = await api.get(`/assignments/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/assignments', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/assignments/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/assignments/${id}`);
    return response.data;
  },
};

// Submission API calls
export const submissionAPI = {
  getAll: async (params) => {
    const response = await api.get('/submissions', { params });
    return response.data;
  },

  getOne: async (id) => {
    const response = await api.get(`/submissions/${id}`);
    return response.data;
  },

  getPendingCount: async () => {
    try {
      console.log('Fetching pending submissions count');
      const response = await api.get('/submissions/pending/count');
      console.log('Pending count response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error in submissionAPI.getPendingCount:', error);
      throw error;
    }
  },

  grade: async (id, data) => {
    const response = await api.post(`/submissions/${id}/grade`, data);
    return response.data;
  },
};

// Student API calls
export const studentAPI = {
  getAll: async (params) => {
    try {
      console.log('Fetching students with params:', params);
      const response = await api.get('/students', { params });
      console.log('Students response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error in studentAPI.getAll:', error);
      throw error;
    }
  },

  getOne: async (id) => {
    const response = await api.get(`/students/${id}`);
    return response.data;
  },

  getByCourse: async (courseId) => {
    const response = await api.get(`/courses/${courseId}/students`);
    return response.data;
  },
};

// Faculty API calls
export const facultyAPI = {
  registerStudent: async (data) => {
    const response = await api.post('/faculty/students', data);
    return response.data;
  },

  getStudents: async () => {
    const response = await api.get('/faculty/students');
    return response.data;
  },

  getDashboard: async () => {
    const response = await api.get('/faculty/dashboard');
    return response.data;
  },
};

// Class API calls
export const classAPI = {
  getAll: async () => {
    const response = await api.get('/faculty/classes');
    return response.data;
  },

  getOne: async (id) => {
    const response = await api.get(`/faculty/classes/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/faculty/classes', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/faculty/classes/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/faculty/classes/${id}`);
    return response.data;
  },

  getAvailableStudents: async (id) => {
    const response = await api.get(`/faculty/classes/${id}/available-students`);
    return response.data;
  },

  addStudent: async (classId, studentId) => {
    const response = await api.post(`/faculty/classes/${classId}/students`, { student_id: studentId });
    return response.data;
  },

  removeStudent: async (classId, studentId) => {
    const response = await api.delete(`/faculty/classes/${classId}/students/${studentId}`);
    return response.data;
  },
};

// Super Admin API calls
export const superAdminAPI = {
  getDashboard: async () => {
    const response = await api.get('/admin/dashboard');
    return response.data;
  },

  getInstructors: async () => {
    const response = await api.get('/admin/instructors');
    return response.data;
  },

  getInstructor: async (id) => {
    const response = await api.get(`/admin/instructors/${id}`);
    return response.data;
  },

  createInstructor: async (data) => {
    const response = await api.post('/admin/instructors', data);
    return response.data;
  },

  updateInstructor: async (id, data) => {
    const response = await api.put(`/admin/instructors/${id}`, data);
    return response.data;
  },

  deleteInstructor: async (id) => {
    const response = await api.delete(`/admin/instructors/${id}`);
    return response.data;
  },

  getInstructorActivities: async (id) => {
    const response = await api.get(`/admin/instructors/${id}/activities`);
    return response.data;
  },

  getInstructorComparison: async () => {
    const response = await api.get('/admin/instructors-comparison');
    return response.data;
  },
};

export default api;
