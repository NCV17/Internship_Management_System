import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Redirects authenticated users away from public pages (login/register)
 * to their role-specific dashboard.
 */
const PublicRoute = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) return null;

  if (isAuthenticated) {
    if (user?.role === "ADMIN") return <Navigate to="/admin" replace />;
    if (user?.role === "LECTURER") return <Navigate to="/lecturer" replace />;
    if (user?.role === "STUDENT") return <Navigate to="/student" replace />;
  }

  return children;
};

export default PublicRoute;
