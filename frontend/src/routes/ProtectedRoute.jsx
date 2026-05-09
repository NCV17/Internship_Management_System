import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * ProtectedRoute - Redirects unauthenticated users to /login.
 * If `allowedRoles` is provided, also checks role authorization.
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, loading } = useAuth();

  // Still loading session from localStorage - show nothing (or a spinner)
  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="spinner" style={{ border: "3px solid #e2e8f0", borderTopColor: "#1e40af", width: 36, height: 36 }} />
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Role check
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // Redirect to their own dashboard
    if (user?.role === "ADMIN") return <Navigate to="/admin" replace />;
    if (user?.role === "LECTURER") return <Navigate to="/lecturer" replace />;
    if (user?.role === "STUDENT") return <Navigate to="/student" replace />;
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
