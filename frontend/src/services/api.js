import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ─── REQUEST INTERCEPTOR: Attach JWT token ────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── RESPONSE INTERCEPTOR: Handle 401 globally ───────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// ─── AUTH API ─────────────────────────────────────────────────────────────
export const authAPI = {
  login: (credentials) => api.post("/auth/login", credentials),
  register: (data) => api.post("/auth/register", data),
  getMe: () => api.get("/auth/me"),
};

// ─── LECTURER API ──────────────────────────────────────────────────────────
export const lecturerAPI = {
  getAll: (params) => api.get("/lecturers", { params }),
  getById: (id) => api.get(`/lecturers/${id}`),
  create: (data) => api.post("/lecturers", data),
  update: (id, data) => api.put(`/lecturers/${id}`, data),
  delete: (id) => api.delete(`/lecturers/${id}`),
  exportExcel: (params) => api.get("/lecturers/export", { params, responseType: "blob" }),
};

// ─── STUDENT API ───────────────────────────────────────────────────────────
export const studentAPI = {
  getAll:                (params)     => api.get("/students", { params }),
  getById:               (id)         => api.get(`/students/${id}`),
  create:                (data)       => api.post("/students", data),
  update:                (id, data)   => api.put(`/students/${id}`, data),
  updateStatus:          (id, data)   => api.patch(`/students/${id}/status`, data),
  updateAccountStatus:   (id, data)   => api.patch(`/students/${id}/account-status`, data),
  delete:                (id)         => api.delete(`/students/${id}`),
  exportExcel:           (params)     => api.get("/students/export", { params, responseType: "blob" }),
};

// ─── PERIOD API ────────────────────────────────────────────────────────────
export const periodAPI = {
  getAll: (params) => api.get("/periods", { params }),
  getById: (id) => api.get(`/periods/${id}`),
  create: (data) => api.post("/periods", data),
  update: (id, data) => api.put(`/periods/${id}`, data),
  delete: (id) => api.delete(`/periods/${id}`),
  getStatistics: (id) => api.get(`/periods/${id}/statistics`),
};

// ─── COMPANY API ───────────────────────────────────────────────────────────
export const companyAPI = {
  getAll: (params) => api.get("/companies", { params }),
  getById: (id) => api.get(`/companies/${id}`),
  create: (data) => api.post("/companies", data),
  update: (id, data) => api.put(`/companies/${id}`, data),
  delete: (id) => api.delete(`/companies/${id}`),
  getStatistics: (id, periodId) => api.get(`/companies/${id}/statistics`, { params: { periodId } }),
  exportExcel: (params) => api.get("/companies/export/excel", { params, responseType: "blob" }),
};

// ─── ASSIGNMENT API ────────────────────────────────────────────────────────
export const assignmentAPI = {
  getAll: (params) => api.get("/assignments", { params }),
  getById: (id) => api.get(`/assignments/${id}`),
  create: (data) => api.post("/assignments", data),
  update: (id, data) => api.put(`/assignments/${id}`, data),
  delete: (id) => api.delete(`/assignments/${id}`),
  getWorkloadStatistics: (params) => api.get("/assignments/statistics/workload", { params }),
  exportExcel: (params) => api.get("/assignments/export/excel", { params, responseType: "blob" }),
  getEligibleStudents: (periodId) => api.get("/assignments/eligible-students", { params: { periodId } }),
};

// ─── ADMIN DASHBOARD API ───────────────────────────────────────────────────
export const dashboardAPI = {
  getOverview: () => api.get("/admin/dashboard/overview"),
  getStatusSummary: () => api.get("/admin/dashboard/status-summary"),
  getTopCompanies: () => api.get("/admin/dashboard/top-companies"),
  getLecturerWorkload: () => api.get("/admin/dashboard/lecturer-workload"),
  getCurrentPeriod: () => api.get("/admin/dashboard/current-period"),
  getRecentActivities: () => api.get("/admin/dashboard/recent-activities"),
};

// ─── REPORT API ────────────────────────────────────────────────────────────
export const reportAPI = {
  getAll: (params) => api.get("/reports", { params }),
  review: (type, id, data) => api.put(`/reports/${type}/${id}/review`, data),
  exportExcel: (params) => api.get("/reports/export/excel", { params, responseType: "blob" }),
};

// ─── STUDENT INTERNSHIP API ────────────────────────────────────────────────
export const studentInternshipAPI = {
  getOpenPeriod: () => api.get("/student/open-period"),
  getCompanies: () => api.get("/student/companies"),
  getMyRegistration: () => api.get("/student/my-registration"),
  registerInternship: (data) => api.post("/student/register-internship", data),
};

export default api;

