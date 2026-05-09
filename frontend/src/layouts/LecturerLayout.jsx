import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

const LecturerLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const handleLogout = () => {
    logout();
    toast.info("Logged out successfully.");
    navigate("/login", { replace: true });
  };

  const navItems = [
    { label: "Dashboard", icon: "📊", to: "/lecturer" },
    { label: "My Students", icon: "🎓", to: "/lecturer/students" },
    { label: "Internship Reports", icon: "📋", to: "/lecturer/reports" },
    { label: "Evaluations", icon: "✅", to: "/lecturer/evaluations" },
    { label: "My Profile", icon: "👤", to: "/lecturer/profile" },
  ];

  const initials = (user?.fullName || user?.username || "L")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="dashboard-layout">
      {/* LECTURER SIDEBAR */}
      <aside className="sidebar" style={{ background: "#1e3a5f" }}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">👨‍🏫</div>
          <div className="sidebar-logo-text">
            <strong>InternshipMS</strong>
            <span>Lecturer Portal</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Lecturer Menu</div>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/lecturer"}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? "active" : ""}`
              }
            >
              <span className="sidebar-link-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{initials}</div>
            <div className="sidebar-user-info">
              <strong>{user?.fullName || user?.username}</strong>
              <span>
                <span className="role-badge lecturer">LECTURER</span>
              </span>
            </div>
          </div>
          <button className="sidebar-link" onClick={handleLogout}>
            <span className="sidebar-link-icon">🚪</span>
            Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="main-content">
        <Outlet />
      </div>
    </div>
  );
};

export default LecturerLayout;
