import { useAuth } from "../context/AuthContext";

const AdminDashboard = () => {
  const { user } = useAuth();

  return (
    <>
      <div className="topbar">
        <div>
          <div className="topbar-title">Admin Dashboard</div>
          <div className="topbar-subtitle">Internship Management System Overview</div>
        </div>
        <span className="role-badge admin">ADMIN</span>
      </div>

      <div className="page-content">
        {/* Welcome */}
        <div className="welcome-card">
          <h2>Welcome back, Administrator! 👋</h2>
          <p>Manage lecturers, students, and internship programs from here.</p>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon blue">👨‍🏫</div>
            <div className="stat-info">
              <div className="stat-number">—</div>
              <div className="stat-label">Total Lecturers</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon green">🎓</div>
            <div className="stat-info">
              <div className="stat-number">—</div>
              <div className="stat-label">Total Students</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon orange">💼</div>
            <div className="stat-info">
              <div className="stat-number">—</div>
              <div className="stat-label">Active Internships</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon purple">📋</div>
            <div className="stat-info">
              <div className="stat-number">—</div>
              <div className="stat-label">Pending Reports</div>
            </div>
          </div>
        </div>

        <div
          style={{
            background: "var(--bg-card)",
            borderRadius: "var(--radius)",
            padding: "24px",
            border: "1px solid var(--border)",
            textAlign: "center",
            color: "var(--text-muted)",
          }}
        >
          <p style={{ fontSize: 32, marginBottom: 8 }}>🛠️</p>
          <p style={{ fontWeight: 600, color: "var(--text-secondary)" }}>
            More features coming soon
          </p>
          <p style={{ fontSize: 13 }}>
            This dashboard will display statistics and management tools.
          </p>
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;
