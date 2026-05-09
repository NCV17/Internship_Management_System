import { useAuth } from "../context/AuthContext";

const LecturerDashboard = () => {
  const { user } = useAuth();

  return (
    <>
      <div className="topbar">
        <div>
          <div className="topbar-title">Lecturer Dashboard</div>
          <div className="topbar-subtitle">
            {user?.department ? `Department: ${user.department}` : "Manage your students and reports"}
          </div>
        </div>
        <span className="role-badge lecturer">LECTURER</span>
      </div>

      <div className="page-content">
        <div className="welcome-card">
          <h2>Welcome, {user?.fullName || user?.username}! 👋</h2>
          <p>
            {user?.lecturerCode && `Code: ${user.lecturerCode} • `}
            Oversee your students' internship progress from here.
          </p>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon green">🎓</div>
            <div className="stat-info">
              <div className="stat-number">—</div>
              <div className="stat-label">Supervised Students</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon orange">📋</div>
            <div className="stat-info">
              <div className="stat-number">—</div>
              <div className="stat-label">Pending Reports</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon purple">✅</div>
            <div className="stat-info">
              <div className="stat-number">—</div>
              <div className="stat-label">Evaluations Done</div>
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
            Student lists, report reviews, and evaluations will appear here.
          </p>
        </div>
      </div>
    </>
  );
};

export default LecturerDashboard;
