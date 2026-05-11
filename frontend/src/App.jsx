import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";

// Routes
import ProtectedRoute from "./routes/ProtectedRoute";
import PublicRoute from "./routes/PublicRoute";

// Layouts
import AdminLayout from "./layouts/AdminLayout";
import LecturerLayout from "./layouts/LecturerLayout";
import StudentLayout from "./layouts/StudentLayout";

// Pages - Auth
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

// Pages - Admin
import AdminDashboard from "./pages/AdminDashboard";
import LecturerManagement from "./pages/LecturerManagement";
import StudentManagement from "./pages/StudentManagement";
import PeriodManagement from "./pages/PeriodManagement";
import CompanyManagement from "./pages/CompanyManagement";
import AssignmentManagement from "./pages/AssignmentManagement";
import ReportManagement from "./pages/ReportManagement";

// Pages - Lecturer
import LecturerDashboard from "./pages/LecturerDashboard";
import LecturerStudents from "./pages/LecturerStudents";
import LecturerStudentDetail from "./pages/LecturerStudentDetail";
import LecturerReports from "./pages/LecturerReports";
import LecturerEvaluations from "./pages/LecturerEvaluations";
import LecturerProfile from "./pages/LecturerProfile";

// Pages - Student
import StudentDashboard from "./pages/StudentDashboard";
import RegisterInternship from "./pages/RegisterInternship";
import InternshipInfo from "./pages/InternshipInfo";
import StudentReports from "./pages/StudentReports";
import StudentEvaluationResults from "./pages/StudentEvaluationResults";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* ── Root redirect ─────────────────────────────────────────── */}
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* ── PUBLIC ROUTES (redirect if already logged in) ─────────── */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <RegisterPage />
                </PublicRoute>
              }
            />

            {/* ── ADMIN ROUTES ──────────────────────────────────────────── */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={["ADMIN"]}>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="lecturers" element={<LecturerManagement />} />
              <Route path="students" element={<StudentManagement />} />
              <Route path="periods" element={<PeriodManagement />} />
              <Route path="companies" element={<CompanyManagement />} />
              <Route path="assignments" element={<AssignmentManagement />} />
              <Route path="reports" element={<ReportManagement />} />
            </Route>

            {/* ── LECTURER ROUTES ───────────────────────────────────────── */}
            <Route
              path="/lecturer"
              element={
                <ProtectedRoute allowedRoles={["LECTURER"]}>
                  <LecturerLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<LecturerDashboard />} />
              <Route path="students" element={<LecturerStudents />} />
              <Route path="students/:id" element={<LecturerStudentDetail />} />
              <Route path="reports" element={<LecturerReports />} />
              <Route path="evaluations" element={<LecturerEvaluations />} />
              <Route path="profile" element={<LecturerProfile />} />
            </Route>

            {/* ── STUDENT ROUTES ────────────────────────────────────────── */}
            <Route
              path="/student"
              element={
                <ProtectedRoute allowedRoles={["STUDENT"]}>
                  <StudentLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<StudentDashboard />} />
              <Route path="register-internship" element={<RegisterInternship />} />
              <Route path="internship-info" element={<InternshipInfo />} />
              <Route path="reports" element={<StudentReports />} />
              <Route path="evaluations" element={<StudentEvaluationResults />} />
            </Route>

            {/* ── 404 FALLBACK ──────────────────────────────────────────── */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
