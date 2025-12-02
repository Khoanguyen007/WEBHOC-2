import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      if (!window.location.pathname.includes('/login')) {
         window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const paymentAPI = {
  generateQRCode: (courseId) => api.post('/v2/payments/qr/generate', { courseId }),
  quickEnrollQR: (courseId) => api.post('/v2/payments/qr/quick-enroll', { courseId }),
  verifyQRPayment: (paymentId) => api.post('/v2/payments/qr/verify', { paymentId }),
  getPaymentDetails: (paymentId) => api.get(`/v2/payments/qr/${paymentId}`),
  getQRPaymentHistory: (params) => api.get('/v2/payments/qr/history', { params }),
  getSupportedBanks: () => api.get('/v2/payments/qr/banks'),
  getCoursePaymentInfo: (courseId) => api.get(`/v2/payments/course/${courseId}/info`),
  manualConfirmPayment: (paymentId, note) => api.post('/v2/payments/qr/manual-confirm', { paymentId, note }),
  getPaymentStats: () => api.get('/v2/payments/qr/stats'),
};

export const authAPI = {
  login: (credentials) => api.post('/v2/auth/login', credentials),
  signup: (userData) => api.post('/v2/auth/signup', userData),
  logout: () => api.post('/v2/auth/logout'),
  refresh: () => api.post('/v2/auth/refresh'),
};

export const userAPI = {
  getProfile: () => api.get('/v2/users/me'),
  updateProfile: (data) => api.patch('/v2/users/me', data),
};

export const courseAPI = {
  getCourses: (params) => api.get('/v2/courses', { params }),
  getCourse: (id) => api.get(`/v2/courses/${id}`),
  getCourseDetail: (id) => api.get(`/v2/courses/${id}`),
  createCourse: (data) => api.post('/v2/courses', data),
  updateCourse: (id, data) => api.patch(`/v2/courses/${id}`, data),
};

export const lessonAPI = {
  getLessons: (courseId) => api.get(`/v2/lessons/courses/${courseId}/lessons`),
  getLessonsByCourse: (courseId) => api.get(`/v2/lessons/courses/${courseId}/lessons`),
  createLesson: (data) => api.post(`/v2/lessons`, data),
  updateLesson: (id, data) => api.patch(`/v2/lessons/${id}`, data),
};

export const enrollmentAPI = {
  enroll: (courseId) => api.post(`/v2/enrollments/courses/${courseId}/enroll`),
  getMyEnrollments: () => api.get('/v2/enrollments/me/enrollments'),
  getEnrollmentsByCourse: (courseId) => api.get(`/v2/enrollments/courses/${courseId}`),
};

export const progressAPI = {
  updateLessonProgress: (lessonId, data) => api.post(`/v2/progress/lessons/${lessonId}`, data),
  getCourseProgress: (courseId) => api.get(`/v2/progress/courses/${courseId}`),
};

export const quizAPI = {
  getQuizzes: (courseId) => api.get(`/v2/quizzes/courses/${courseId}`),
  getQuizzesByCourse: (courseId) => api.get(`/v2/quizzes/courses/${courseId}`),
  getQuiz: (id) => api.get(`/v2/quizzes/${id}`),
  createQuiz: (data) => api.post(`/v2/quizzes`, data),
  updateQuiz: (id, data) => api.patch(`/v2/quizzes/${id}`, data),
  submitQuiz: (quizId, data) => api.post(`/v2/quizzes/${quizId}/attempt`, data),
  getMyAttempts: () => api.get('/v2/quizzes/me/attempts'),
};

export const fileAPI = {
  getUploadUrl: (data) => api.post('/v2/files/upload-request', data),
};

export const adminAPI = {
  getStats: () => api.get('/v2/admin/stats'),
};

export default api;