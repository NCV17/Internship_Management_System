import { useAuth } from "../context/AuthContext";

const StudentDashboard = () => {
  const { user } = useAuth();

  return (
    <>
      <div className="topbar">
        <div>
          <div className="topbar-title">Bảng điều khiển Sinh viên</div>
          <div className="topbar-subtitle">
            {user?.className ? `Lớp: ${user.className}` : "Theo dõi tiến độ thực tập của bạn"}
          </div>
        </div>
        <span className="role-badge student">SINH VIÊN</span>
      </div>

      <div className="page-content">
        <div className="welcome-card">
          <h2>Xin chào, {user?.fullName || user?.username}!</h2>
          <p>
            {user?.studentCode && `MSSV: ${user.studentCode} • `}
            Theo dõi thực tập, nộp báo cáo và xem kết quả đánh giá tại đây.
          </p>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon blue"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg></div>
            <div className="stat-info">
              <div className="stat-number">—</div>
              <div className="stat-label">Trạng thái Thực tập</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon orange"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg></div>
            <div className="stat-info">
              <div className="stat-number">—</div>
              <div className="stat-label">Báo cáo đã nộp</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon purple"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg></div>
            <div className="stat-info">
              <div className="stat-number">—</div>
              <div className="stat-label">Điểm trung bình</div>
            </div>
          </div>
        </div>

        {/* Student Info Card */}
        <div
          style={{
            background: "var(--bg-card)",
            borderRadius: "var(--radius)",
            padding: "32px 24px",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
              Thông tin Cá nhân
            </h3>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 24px" }}>
            {[
              { label: "Họ và tên", value: user?.fullName },
              { label: "Mã Sinh viên", value: user?.studentCode },
              { label: "Lớp", value: user?.className },
              { label: "Email", value: user?.email },
              { label: "Điện thoại", value: user?.phone || "Chưa cập nhật" },
            ].map((item) => (
              <div key={item.label} style={{ padding: "12px", background: "var(--bg-input)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
                <p style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>
                  {item.label}
                </p>
                <p style={{ fontSize: 14, color: "var(--text-primary)", fontWeight: 600 }}>
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
