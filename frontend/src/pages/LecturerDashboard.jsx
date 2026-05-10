import { useAuth } from "../context/AuthContext";

const LecturerDashboard = () => {
  const { user } = useAuth();

  return (
    <>
      <div className="topbar">
        <div>
          <div className="topbar-title">Bảng điều khiển Giảng viên</div>
          <div className="topbar-subtitle">
            {user?.department ? `Khoa/Bộ môn: ${user.department}` : "Quản lý sinh viên và báo cáo thực tập"}
          </div>
        </div>
        <span className="role-badge lecturer">GIẢNG VIÊN</span>
      </div>

      <div className="page-content">
        <div className="welcome-card">
          <h2>Xin chào, {user?.fullName || user?.username}!</h2>
          <p>
            {user?.lecturerCode && `Mã GV: ${user.lecturerCode} • `}
            Theo dõi tiến độ thực tập của sinh viên được phân công tại đây.
          </p>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon green"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg></div>
            <div className="stat-info">
              <div className="stat-number">—</div>
              <div className="stat-label">Sinh viên hướng dẫn</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon orange"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg></div>
            <div className="stat-info">
              <div className="stat-number">—</div>
              <div className="stat-label">Báo cáo chờ duyệt</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon purple"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg></div>
            <div className="stat-info">
              <div className="stat-number">—</div>
              <div className="stat-label">Đã chấm điểm</div>
            </div>
          </div>
        </div>

        <div
          style={{
            background: "var(--bg-card)",
            borderRadius: "var(--radius)",
            padding: "32px 24px",
            border: "1px solid var(--border)",
            textAlign: "center",
            color: "var(--text-muted)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "12px" }}>
            <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </div>
          <p style={{ fontWeight: 600, color: "var(--text-secondary)" }}>
            Tính năng đang được phát triển
          </p>
          <p style={{ fontSize: 13, marginTop: 4 }}>
            Danh sách sinh viên, tính năng duyệt báo cáo và đánh giá sẽ hiển thị tại đây.
          </p>
        </div>
      </div>
    </>
  );
};

export default LecturerDashboard;
