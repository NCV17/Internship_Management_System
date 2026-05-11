import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { lecturerDashboardAPI } from "../services/api";

const LecturerDashboard = () => {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await lecturerDashboardAPI.getDashboard();
        setData(response.data.data);
      } catch (error) {
        console.error("Dashboard error:", error);
        toast.error("Không thể tải dữ liệu bảng điều khiển.");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="spinner"></div>
      </div>
    );
  }

  const {
    lecturer,
    activePeriod,
    totalStudents,
    pendingReports,
    revisionReports,
    evaluatedStudents,
    recentSubmissions,
    upcomingDeadlines,
  } = data || {};

  return (
    <>
      <div className="topbar">
        <div>
          <div className="topbar-title">Bảng điều khiển Giảng viên</div>
          <div className="topbar-subtitle">
            {activePeriod 
              ? `Kỳ hiện tại: ${activePeriod.PeriodName} (${activePeriod.Semester} - ${activePeriod.AcademicYear})`
              : "Chưa có kỳ thực tập nào đang diễn ra"}
          </div>
        </div>
        <span className="role-badge lecturer">GIẢNG VIÊN</span>
      </div>

      <div className="page-content">
        {/* SECTION A — HERO OVERVIEW */}
        <div 
          className="welcome-card" 
          style={{
            background: "linear-gradient(135deg, var(--primary-dark), var(--primary), var(--accent))",
            color: "white",
            border: "none",
            borderRadius: "var(--radius-lg)",
            padding: "32px",
            boxShadow: "0 10px 25px rgba(30, 58, 138, 0.2)",
            position: "relative",
            overflow: "hidden"
          }}
        >
          {/* Background pattern */}
          <div style={{ position: "absolute", top: "-20%", right: "-5%", opacity: 0.1, transform: "scale(2)" }}>
            <svg width="200" height="200" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 14l9-5-9-5-9 5 9 5z" />
              <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
            </svg>
          </div>
          
          <div style={{ position: "relative", zIndex: 1 }}>
            <h1 style={{ fontSize: "28px", fontWeight: 800, marginBottom: "8px", letterSpacing: "-0.5px" }}>
              Xin chào, thầy/cô {lecturer?.FullName || user?.fullName}!
            </h1>
            <p style={{ fontSize: "16px", opacity: 0.9, maxWidth: "600px", marginBottom: "24px" }}>
              {lecturer?.Department ? `Khoa/Bộ môn: ${lecturer.Department} • ` : ""}
              Theo dõi và quản lý tiến độ thực tập của sinh viên được phân công.
            </p>
            
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <Link to="/lecturer/students" className="btn-primary" style={{ width: "auto", background: "rgba(255,255,255,0.2)", backdropFilter: "blur(4px)", border: "1px solid rgba(255,255,255,0.3)", boxShadow: "none" }}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                Xem sinh viên
              </Link>
              <Link to="/lecturer/reports" className="btn-primary" style={{ width: "auto", background: "rgba(255,255,255,0.2)", backdropFilter: "blur(4px)", border: "1px solid rgba(255,255,255,0.3)", boxShadow: "none" }}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                Duyệt báo cáo
              </Link>
            </div>
          </div>
        </div>

        {/* OVERVIEW STATS */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon blue">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            </div>
            <div className="stat-info">
              <div className="stat-number">{totalStudents}</div>
              <div className="stat-label">Tổng sinh viên hướng dẫn</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon orange">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div className="stat-info">
              <div className="stat-number">{pendingReports}</div>
              <div className="stat-label">Báo cáo chờ duyệt</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon" style={{ background: "#fee2e2", color: "#ef4444" }}>
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            </div>
            <div className="stat-info">
              <div className="stat-number">{revisionReports}</div>
              <div className="stat-label">Báo cáo cần sửa</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon green">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
            </div>
            <div className="stat-info">
              <div className="stat-number">{evaluatedStudents}</div>
              <div className="stat-label">Đã đánh giá</div>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "28px" }}>
          
          {/* RECENT SUBMISSIONS */}
          <div style={{ background: "var(--bg-card)", borderRadius: "var(--radius)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)", overflow: "hidden" }}>
            <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0 }}>Báo cáo mới nộp</h3>
              <Link to="/lecturer/reports" style={{ fontSize: "13px", color: "var(--primary)", fontWeight: 600, textDecoration: "none" }}>Xem tất cả &rarr;</Link>
            </div>
            
            <div>
              {recentSubmissions && recentSubmissions.length > 0 ? (
                <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                  {recentSubmissions.map((sub, idx) => (
                    <li key={idx} style={{ 
                      padding: "16px 24px", 
                      borderBottom: idx < recentSubmissions.length - 1 ? "1px solid var(--border)" : "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "16px",
                      transition: "background 0.2s"
                    }} className="hover:bg-slate-50">
                      
                      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        <div style={{ 
                          width: "40px", height: "40px", borderRadius: "50%", 
                          background: sub.reportType === 'WEEKLY' ? "#eff6ff" : "#f5f3ff",
                          color: sub.reportType === 'WEEKLY' ? "#3b82f6" : "#8b5cf6",
                          display: "flex", alignItems: "center", justifyContent: "center"
                        }}>
                          {sub.reportType === 'WEEKLY' 
                            ? <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            : <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                          }
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "14px", marginBottom: "2px" }}>
                            {sub.studentName} <span style={{ color: "var(--text-muted)", fontWeight: 400, fontSize: "13px" }}>({sub.StudentCode})</span>
                          </div>
                          <div style={{ color: "var(--text-secondary)", fontSize: "13px" }}>
                            {sub.title || (sub.reportType === 'WEEKLY' ? "Báo cáo tuần" : "Báo cáo cuối kỳ")}
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <div style={{ marginBottom: "4px" }}>
                          {sub.status === 'PENDING' && <span className="lm-filter-tag" style={{ background: "#fef3c7", color: "#92400e", borderColor: "#fde68a" }}>Chờ duyệt</span>}
                          {sub.status === 'APPROVED' && <span className="lm-filter-tag" style={{ background: "#dcfce7", color: "#166534", borderColor: "#bbf7d0" }}>Đã duyệt</span>}
                          {sub.status === 'REVISION_REQUIRED' && <span className="lm-filter-tag" style={{ background: "#fee2e2", color: "#b91c1c", borderColor: "#fecaca" }}>Cần sửa</span>}
                          {sub.status === 'REJECTED' && <span className="lm-filter-tag" style={{ background: "#f3f4f6", color: "#374151", borderColor: "#e5e7eb" }}>Từ chối</span>}
                        </div>
                        <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                          {new Date(sub.submittedAt).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div style={{ padding: "32px", textAlign: "center", color: "var(--text-muted)", fontSize: "14px" }}>
                  Chưa có báo cáo nào được nộp.
                </div>
              )}
            </div>
          </div>

          {/* UPCOMING DEADLINES */}
          <div style={{ background: "var(--bg-card)", borderRadius: "var(--radius)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--border)" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0 }}>Hạn chót sắp tới</h3>
            </div>
            
            <div style={{ flex: 1, padding: "20px" }}>
              {upcomingDeadlines && upcomingDeadlines.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {upcomingDeadlines.map((dl, idx) => (
                    <div key={idx} style={{ 
                      padding: "16px", 
                      borderRadius: "var(--radius-sm)", 
                      background: dl.remainingDays <= 3 ? "#fef2f2" : "#f8fafc",
                      border: `1px solid ${dl.remainingDays <= 3 ? "#fecaca" : "var(--border)"}`
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                        <div style={{ fontWeight: 600, fontSize: "14px", color: dl.remainingDays <= 3 ? "#991b1b" : "var(--text-primary)" }}>
                          {dl.Title}
                        </div>
                        <div style={{ 
                          fontSize: "12px", 
                          fontWeight: 700, 
                          color: dl.remainingDays <= 3 ? "#dc2626" : "var(--primary)",
                          background: dl.remainingDays <= 3 ? "#fee2e2" : "#eff6ff",
                          padding: "2px 8px",
                          borderRadius: "12px",
                          whiteSpace: "nowrap"
                        }}>
                          Còn {dl.remainingDays} ngày
                        </div>
                      </div>
                      
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-muted)", fontSize: "13px" }}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Hạn: {new Date(dl.DueDate).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "14px", gap: "12px", padding: "24px 0" }}>
                  <svg className="w-12 h-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <p>Không có hạn chót nào sắp tới.</p>
                </div>
              )}
            </div>
            
            <div style={{ padding: "16px", borderTop: "1px solid var(--border)", background: "#f8fafc" }}>
              <button className="btn-primary"
                onClick={() => navigate("/lecturer/reports?create=true")}
                style={{ width: "100%", background: "white", color: "var(--text-primary)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
                Tạo kỳ báo cáo mới
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LecturerDashboard;
