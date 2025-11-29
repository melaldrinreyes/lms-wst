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
  timeout: 300000, // 5 minutes timeout for large file uploads
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
    
    const status = error.response?.status;
    if (status === 401) {
      // Token expired or invalid: clear local state and notify app
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      try {
        // Dispatch an event so React app can listen and show a message if desired
        window.dispatchEvent(new CustomEvent('unauthenticated', { detail: { message: 'Session expired' } }));
      } catch {
        // ignore
      }
      // Redirect to login page (replace so back button doesn't return to protected page)
      try { window.location.replace('/login'); } catch { window.location.href = '/login'; }
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
    try {
      const response = await api.get('/user');
      return response.data;
    } catch (error) {
      console.error('Error fetching user data:', error);
      throw error; // Re-throw the error to be handled by the caller
    }
  },

  updateProfile: async (data) => {
    // Check if data is FormData (for file uploads)
    const isFormData = data instanceof FormData;
    const method = isFormData ? 'post' : 'put';
    const response = await api[method]('/user/profile', data, {
      headers: isFormData ? {
        'Content-Type': undefined, // Let browser set multipart/form-data
      } : undefined,
    });
    return response.data;
  },

  updatePassword: async (data) => {
    const response = await api.put('/user/password', data);
    return response.data;
  },
};

// Course API calls
export const courseAPI = {
  getAll: async (params = {}) => {
    try {
      console.log('Fetching courses from:', `${API_URL}/courses`, params);
      const response = await api.get('/courses', { params });
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

  enroll: async (courseId) => {
    const response = await api.post(`/courses/${courseId}/enroll`);
    return response.data;
  },

  updateStudentStatus: async (courseId, studentId, status) => {
    const response = await api.put(`/courses/${courseId}/students/${studentId}/status`, { status });
    return response.data;
  },

  removeStudent: async (courseId, studentId) => {
    const response = await api.delete(`/courses/${courseId}/students/${studentId}`);
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
    const response = await api.post('/assignments', data, {
      headers: {
        'Content-Type': undefined,
      },
    });
    return response.data;
  },

  update: async (id, data) => {
    // Add _method field for Laravel to recognize PUT request with FormData
    data.append('_method', 'PUT');
    
    const response = await api.post(`/assignments/${id}`, data, {
      headers: {
        'Content-Type': undefined,
      },
    });
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/assignments/${id}`);
    return response.data;
  },

  download: async (id) => {
    try {
      const response = await api.get(`/assignments/${id}/download`, {
        responseType: 'blob',
      });
      
      // Create a download link
      // Use the response blob to preserve MIME type; fall back to header if needed
      const blobType2 = response.data.type || response.headers['content-type'] || 'application/octet-stream';
      const blob2 = response.data instanceof Blob ? response.data : new Blob([response.data], { type: blobType2 });
      const url = window.URL.createObjectURL(blob2);
      const link = document.createElement('a');
      link.href = url;
      
      // Extract filename from Content-Disposition header or use default
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'assignment-download';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    } catch (error) {
      console.error('Download error:', error);
      throw error;
    }
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

  create: async (data, onUploadProgress) => {
    const response = await api.post('/submissions', data, {
      // Let the browser/axios set the correct multipart boundary
      headers: {
        'Content-Type': undefined,
      },
      timeout: 600000, // 10 minutes for large file uploads
      onUploadProgress: onUploadProgress, // Progress tracking
    });
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

  download: async (id) => {
    try {
      const response = await api.get(`/submissions/${id}/download`, {
        responseType: 'blob',
      });

      // Extract filename from Content-Disposition header or fallback to basename
      let filename = 'submission-download';
      const contentDisposition = response.headers['content-disposition'];
      if (contentDisposition) {
        // Try to match filename="..." or filename=...
        let filenameMatch = contentDisposition.match(/filename\*=UTF-8''([^;\n]*)/); // RFC 5987
        if (filenameMatch && filenameMatch[1]) {
          filename = decodeURIComponent(filenameMatch[1]);
        } else {
          filenameMatch = contentDisposition.match(/filename="?([^";\n]+)"?/);
          if (filenameMatch && filenameMatch[1]) {
            filename = filenameMatch[1].trim();
          }
        }
      }
      // Fallback: if filename is still empty, use the basename from the file path in response (if available)
      if (!filename || filename === 'submission-download') {
        // Try to get from Content-FilePath custom header (if you want to add it in backend), or just leave as default
        // Optionally, you can add a custom header in backend for the original file path
      }

      // Use the correct MIME type from the response
      let mimeType = response.headers['content-type'] || 'application/octet-stream';
      // Fallback: infer from filename extension if content-type is generic or missing
      if (mimeType === 'application/octet-stream' && filename.includes('.')) {
        const ext = filename.split('.').pop().toLowerCase();
        const extToMime = {
          'pdf': 'application/pdf', 'doc': 'application/msword', 'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'ppt': 'application/vnd.ms-powerpoint', 'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'txt': 'text/plain', 'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png', 'gif': 'image/gif',
          'mp4': 'video/mp4', 'mov': 'video/quicktime', 'avi': 'video/x-msvideo', 'mkv': 'video/x-matroska', 'webm': 'video/webm',
          'flv': 'video/x-flv', 'wmv': 'video/x-ms-wmv', 'zip': 'application/zip', 'rar': 'application/x-rar-compressed',
          'pkt': 'application/octet-stream', 'pk': 'application/octet-stream', 'csv': 'text/csv', 'xls': 'application/vnd.ms-excel',
          'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'json': 'application/json', 'xml': 'application/xml',
          // Add more as needed
        };
        if (extToMime[ext]) mimeType = extToMime[ext];
      }
      const blob = new Blob([response.data], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return { success: true };
    } catch (error) {
      console.error('Download error:', error);
      throw error;
    }
  },

  // Reject a submission by ID
  reject: async (id) => {
    const response = await api.post(`/submissions/${id}/reject`);
    return response.data;
  },

  // Delete a submission by ID
  delete: async (id) => {
    const response = await api.delete(`/submissions/${id}`);
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

  getMyClasses: async () => {
    const response = await api.get('/student/classes');
    return response.data;
  },

  getMyCourses: async () => {
    const response = await api.get('/student/courses');
    return response.data;
  },

  getCourseDetails: async (courseId) => {
    const response = await api.get(`/student/courses/${courseId}`);
    return response.data;
  },

  getMyAssignments: async () => {
    const response = await api.get('/student/assignments');
    return response.data;
  },

  downloadAssignment: async (assignmentId) => {
    const response = await api.get(`/assignments/${assignmentId}/download`, {
      responseType: 'blob',
    });
    return response;
  },

  // Download a specific assignment file by its file record id (for assignments with multiple files)
  downloadAssignmentFile: async (fileId) => {
    const response = await api.get(`/assignments/files/${fileId}/download`, {
      responseType: 'blob',
    });
    return response;
  },

  // submitAssignment accepts either a plain object { assignment_id, submission_text, file }
  // or a FormData instance. An optional `config` param may include axios options
  // such as `onUploadProgress` to report upload progress.
  submitAssignment: async (data, config = {}) => {
    let formData;
    if (data instanceof FormData) {
      formData = data;
    } else {
      formData = new FormData();
      formData.append('assignment_id', data.assignment_id);
      if (data.submission_text) {
        formData.append('submission_text', data.submission_text);
      }
      if (data.file) {
        formData.append('file', data.file);
      }
    }

    // Ensure the browser sets Content-Type with boundary
    const headers = { ...(config.headers || {}) };
    if (!headers['Content-Type']) headers['Content-Type'] = undefined;

    const response = await api.post('/submissions', formData, {
      ...config,
      headers,
    });
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

  // Enrollment requests
  getEnrollmentRequests: async () => {
    const response = await api.get('/faculty/enrollment-requests');
    return response.data;
  },

  approveEnrollmentRequest: async (id) => {
    const response = await api.post(`/faculty/enrollment-requests/${id}/approve`);
    return response.data;
  },

  rejectEnrollmentRequest: async (id) => {
    const response = await api.post(`/faculty/enrollment-requests/${id}/reject`);
    return response.data;
  },

  deleteEnrollmentRequest: async (id) => {
    const response = await api.delete(`/faculty/enrollment-requests/${id}`);
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

// Announcement API calls
export const announcementAPI = {
  getAll: async () => {
    const response = await api.get('/announcements');
    return response.data;
  },

  getOne: async (id) => {
    const response = await api.get(`/announcements/${id}`);
    return response.data;
  },

  getByCourse: async (courseId) => {
    const response = await api.get(`/faculty/courses/${courseId}/announcements`);
    return response.data;
  },

  getStudentAnnouncements: async () => {
    const response = await api.get('/student/announcements');
    return response.data;
  },

  getFacultyAnnouncements: async () => {
    const response = await api.get('/faculty/announcements');
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/announcements', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/announcements/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/announcements/${id}`);
    return response.data;
  },
};

// Announcement Comment API calls
export const announcementCommentAPI = {
  getByAnnouncement: async (announcementId) => {
    const response = await api.get(`/announcements/${announcementId}/comments`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/announcement-comments', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/announcement-comments/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/announcement-comments/${id}`);
    return response.data;
  },
};

// Super Admin API calls
export const superAdminAPI = {
  getDashboard: async () => {
    const response = await api.get('/admin/dashboard');
    return response.data;
  },

  getUsers: async () => {
    const response = await api.get('/admin/users');
    return response.data;
  },

  createUser: async (data) => {
    const response = await api.post('/admin/users', data);
    return response.data;
  },

  updateUser: async (id, data) => {
    const response = await api.put(`/admin/users/${id}`, data);
    return response.data;
  },

  deleteUser: async (id) => {
    const response = await api.delete(`/admin/users/${id}`);
    return response.data;
  },

  getInstructors: async (params = {}) => {
    const response = await api.get('/admin/instructors', { params });
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

// Class Material API calls
export const classMaterialAPI = {
  getByCourse: async (courseId) => {
    const response = await api.get(`/courses/${courseId}/materials`);
    return response.data;
  },

  create: async (courseId, data, onUploadProgress) => {
    const response = await api.post(`/courses/${courseId}/materials`, data, {
      headers: {
        'Content-Type': undefined,
      },
      timeout: 600000, // 10 minutes for large file uploads
      onUploadProgress: onUploadProgress, // Progress tracking
    });
    return response.data;
  },

  download: async (id) => {
    try {
      const response = await api.get(`/class-materials/${id}/download`, {
        responseType: 'blob',
      });
      
      // Create a download link
      const blobType = response.data.type || response.headers['content-type'] || 'application/octet-stream';
      const blob = response.data instanceof Blob ? response.data : new Blob([response.data], { type: blobType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Extract filename from Content-Disposition header or use default
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'class-material-download';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    } catch (error) {
      console.error('Download error:', error);
      throw error;
    }
  },

  delete: async (id) => {
    const response = await api.delete(`/class-materials/${id}`);
    return response.data;
  },
};

export default api;
