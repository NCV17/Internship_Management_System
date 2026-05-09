import { useAuth } from "../context/AuthContext";

const StudentDashboard = () => {
  const { user } = useAuth();

  return (
    <>
      <div className="topbar">
        <div>
          <div className="topbar-title">Student Dashboard</div>
          <div className="topbar-subtitle">
            {user?.className ? `Class: ${user.className}` : "Track your internship progress"}
          </div>
        </div>
        <span className="role-badge student">STUDENT</span>
      </div>

      <div className="page-content">
        <div className="welcome-card">
          <h2>Welcome, {user?.fullName || user?.username}! 🎓</h2>
          <p>
            {user?.studentCode && `MSSV: ${user.studentCode} • `}
            Track your internship, submit reports, and view evaluations here.
          </p>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon blue">💼</div>
            <div className="stat-info">
              <div className="stat-number">—</div>
              <div className="stat-label">Internship Status</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon orange">📤</div>
            <div className="stat-info">
              <div className="stat-number">—</div>
              <div className="stat-label">Reports Submitted</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon purple">⭐</div>
            <div className="stat-info">
              <div className="stat-number">—</div>
              <div className="stat-label">Average Score</div>
            </div>
          </div>
        </div>

        {/* Student Info Card */}
        <div
          style={{
            background: "var(--bg-card)",
            borderRadius: "var(--radius)",
            padding: "24px",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: "var(--text-primary)" }}>
            📋 My Information
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 24px" }}>
            {[
              { label: "Full Name", value: user?.fullName },
              { label: "Student Code", value: user?.studentCode },
              { label: "Class", value: user?.className },
              { label: "Email", value: user?.email },
              { label: "Phone", value: user?.phone || "Not provided" },
            ].map((item) => (
              <div key={item.label}>
                <p style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 3 }}>
                  {item.label}
                </p>
                <p style={{ fontSize: 14, color: "var(--text-primary)", fontWeight: 500 }}>
                  {item.value || "—"}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default StudentDashboard;
