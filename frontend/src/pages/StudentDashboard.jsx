import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { studentInternshipAPI } from "../services/api";

const StudentDashboard = () => {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [internshipData, setInternshipData] = useState(null);
  const [templatesData, setTemplatesData] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [infoRes, reportsRes] = await Promise.all([
          studentInternshipAPI.getMyInternshipInfo(),
          studentInternshipAPI.getReports().catch(() => ({ data: { data: [] } }))
        ]);

        if (infoRes.data.success) {
          setInternshipData(infoRes.data.data);
        }
        if (reportsRes.data?.success) {
          setTemplatesData(reportsRes.data.data);
        }
      } catch (error) {
        console.error("Lỗi tải dữ liệu dashboard:", error);
        toast.error("Không thể tải dữ liệu bảng điều khiển.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="spinner"></div>
      </div>
    );
  }

  const { registration, assignment, weeklyReports, finalReport, evaluation } = internshipData || {};

  // Calculate stats
  const submittedReports = weeklyReports?.filter(r => r.Status !== 'DRAFT') || [];
  const pendingReportsCount = submittedReports.filter(r => r.Status === 'PENDING').length;
  const approvedReportsCount = submittedReports.filter(r => r.Status === 'APPROVED').length;
  const revisionReportsCount = submittedReports.filter(r => r.Status === 'REVISION_REQUIRED').length;
  
  // Recent reports (sort by SubmittedAt desc)
  const recentReports = [...submittedReports]
    .sort((a, b) => new Date(b.SubmittedAt) - new Date(a.SubmittedAt))
    .slice(0, 3);

  // Upcoming deadlines (templates that are OPEN and due date is in the future)
  const now = new Date();
  const upcomingDeadlines = templatesData
    .filter(t => t.TemplateStatus === 'OPEN' && new Date(t.DueDate) > now && (!t.SubmissionStatus || t.SubmissionStatus === 'REVISION_REQUIRED'))
    .map(t => {
      const dueDate = new Date(t.DueDate);
      const diffTime = dueDate - now;
      const remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return { ...t, remainingDays };
    })
    .sort((a, b) => a.remainingDays - b.remainingDays)
    .slice(0, 3);

  // Determine internship status
  let internshipStatus = "Chưa đăng ký";
  let statusColor = "#64748b"; // slate-500
  let statusBg = "#f1f5f9"; // slate-100
  let progressPercent = 0;

  if (registration) {
    if (assignment) {
      const totalApproved = approvedReportsCount + (finalReport?.Status === 'APPROVED' ? 1 : 0);
      const totalTemplates = templatesData.length > 0 ? templatesData.length : 1;
      progressPercent = Math.min(Math.round((totalApproved / totalTemplates) * 100), 100); 

      if (evaluation) {
        internshipStatus = "Đã hoàn thành";
        statusColor = "#166534"; // green-800
        statusBg = "#dcfce7"; // green-100
      } else {
        internshipStatus = "Đang thực tập";
        statusColor = "#1e40af"; // blue-800
        statusBg = "#dbeafe"; // blue-100
      }
    } else {
      internshipStatus = "Chờ phân công GV";
      statusColor = "#92400e"; // amber-800
      statusBg = "#fef3c7"; // amber-100
      progressPercent = 0;
    }
  }

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
        {/* 1. HERO CARD */}
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
          
          <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "20px" }}>
              <div>
                <h1 style={{ fontSize: "28px", fontWeight: 800, marginBottom: "8px", letterSpacing: "-0.5px" }}>
                  Xin chào, {user?.fullName || user?.username}!
                </h1>
                <p style={{ fontSize: "15px", opacity: 0.9, maxWidth: "600px", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ padding: "4px 10px", background: statusBg, color: statusColor, borderRadius: "20px", fontSize: "12px", fontWeight: "bold" }}>
                    {internshipStatus}
                  </span>
                  {user?.studentCode && <span>• MSSV: {user.studentCode}</span>}
                </p>
              </div>
              
              {registration && (
                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                  <Link to="/student/reports" className="btn-primary" style={{ width: "auto", background: "rgba(255,255,255,0.2)", backdropFilter: "blur(4px)", border: "1px solid rgba(255,255,255,0.3)", boxShadow: "none" }}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    Nộp báo cáo
                  </Link>
                  <Link to="/student/evaluations" className="btn-primary" style={{ width: "auto", background: "rgba(255,255,255,0.2)", backdropFilter: "blur(4px)", border: "1px solid rgba(255,255,255,0.3)", boxShadow: "none" }}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Kết quả đánh giá
                  </Link>
                </div>
              )}
            </div>

            {registration && (
              <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: "var(--radius-sm)", padding: "16px 20px", display: "flex", flexWrap: "wrap", gap: "24px", alignItems: "center" }}>
                <div style={{ flex: 1, minWidth: "200px" }}>
                  <div style={{ fontSize: "12px", opacity: 0.8, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>Công ty thực tập</div>
                  <div style={{ fontSize: "16px", fontWeight: "bold" }}>{registration.CompanyName}</div>
                </div>
                <div style={{ width: "1px", height: "40px", background: "rgba(255,255,255,0.2)" }} className="hidden md:block"></div>
                <div style={{ flex: 1, minWidth: "200px" }}>
                  <div style={{ fontSize: "12px", opacity: 0.8, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>Giảng viên hướng dẫn</div>
                  <div style={{ fontSize: "16px", fontWeight: "bold" }}>{assignment?.LecturerName || "Chưa phân công"}</div>
                </div>
                <div style={{ width: "1px", height: "40px", background: "rgba(255,255,255,0.2)" }} className="hidden md:block"></div>
                <div style={{ flex: 1.5, minWidth: "200px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <div style={{ fontSize: "12px", opacity: 0.8, textTransform: "uppercase", letterSpacing: "0.5px" }}>Tiến độ</div>
                    <div style={{ fontSize: "13px", fontWeight: "bold" }}>{progressPercent}%</div>
                  </div>
                  <div style={{ width: "100%", height: "6px", background: "rgba(0,0,0,0.2)", borderRadius: "3px", overflow: "hidden" }}>
                    <div style={{ width: `${progressPercent}%`, height: "100%", background: "#4ade80", borderRadius: "3px", transition: "width 1s ease-in-out" }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 2. OVERVIEW STATS */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon blue">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </div>
            <div className="stat-info">
              <div className="stat-number">{submittedReports.length}</div>
              <div className="stat-label">Báo cáo đã nộp</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon orange">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div className="stat-info">
              <div className="stat-number">{pendingReportsCount}</div>
              <div className="stat-label">Đang chờ duyệt</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon green">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div className="stat-info">
              <div className="stat-number">{approvedReportsCount}</div>
              <div className="stat-label">Báo cáo đã duyệt</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon purple">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
            </div>
            <div className="stat-info">
              <div className="stat-number">{evaluation?.TotalScore || "—"}</div>
              <div className="stat-label">Điểm đánh giá</div>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "28px" }}>
          
          {/* 3. RECENT REPORTS */}
          <div style={{ background: "var(--bg-card)", borderRadius: "var(--radius)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)", overflow: "hidden" }}>
            <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0 }}>Báo cáo gần đây</h3>
              <Link to="/student/reports" style={{ fontSize: "13px", color: "var(--primary)", fontWeight: 600, textDecoration: "none" }}>Xem tất cả &rarr;</Link>
            </div>
            
            <div>
              {recentReports && recentReports.length > 0 ? (
                <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                  {recentReports.map((report, idx) => (
                    <li key={idx} style={{ 
                      padding: "16px 24px", 
                      borderBottom: idx < recentReports.length - 1 ? "1px solid var(--border)" : "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "16px",
                    }}>
                      
                      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        <div style={{ 
                          width: "40px", height: "40px", borderRadius: "50%", 
                          background: "#eff6ff", color: "#3b82f6",
                          display: "flex", alignItems: "center", justifyContent: "center"
                        }}>
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "14px", marginBottom: "2px" }}>
                            {report.Title || `Báo cáo tuần ${report.WeekNumber}`}
                          </div>
                          <div style={{ color: "var(--text-secondary)", fontSize: "13px", display: "flex", alignItems: "center", gap: "4px" }}>
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            {new Date(report.SubmittedAt).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: "right" }}>
                        {report.Status === 'PENDING' && <span className="lm-filter-tag" style={{ background: "#fef3c7", color: "#92400e", borderColor: "#fde68a" }}>Chờ duyệt</span>}
                        {report.Status === 'APPROVED' && <span className="lm-filter-tag" style={{ background: "#dcfce7", color: "#166534", borderColor: "#bbf7d0" }}>Đã duyệt</span>}
                        {report.Status === 'REVISION_REQUIRED' && <span className="lm-filter-tag" style={{ background: "#fee2e2", color: "#b91c1c", borderColor: "#fecaca" }}>Cần sửa</span>}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div style={{ padding: "32px", textAlign: "center", color: "var(--text-muted)", fontSize: "14px" }}>
                  Bạn chưa nộp báo cáo nào.
                </div>
              )}
            </div>
          </div>

          {/* 4. UPCOMING DEADLINES */}
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
                  <p>Không có hạn nộp báo cáo nào sắp tới.</p>
                </div>
              )}
            </div>
            
            <div style={{ padding: "16px", borderTop: "1px solid var(--border)", background: "#f8fafc" }}>
              <Link to="/student/reports" style={{ textDecoration: "none" }}>
                <button className="btn-primary" style={{ width: "100%", background: "white", color: "var(--text-primary)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
                  Xem tất cả báo cáo
                </button>
              </Link>
            </div>
          </div>
        </div>

      </div>
    </>
  );
};

export default StudentDashboard;
