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

// Pages - Lecturer
import LecturerDashboard from "./pages/LecturerDashboard";

// Pages - Student
import StudentDashboard from "./pages/StudentDashboard";

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
              {/* Add more admin pages here as nested routes */}
              {/* <Route path="lecturers" element={<ManageLecturers />} /> */}
              {/* <Route path="students" element={<ManageStudents />} /> */}
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
              <Route index element={<LecturerDashboard />} />
              {/* Add more lecturer pages here as nested routes */}
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
              {/* Add more student pages here as nested routes */}
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
