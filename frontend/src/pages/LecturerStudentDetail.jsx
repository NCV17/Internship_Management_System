import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { lecturerDashboardAPI } from "../services/api";
import { useToast } from "../context/ToastContext";

const LecturerStudentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const res = await lecturerDashboardAPI.getStudentDetail(id);
        setData(res.data.data);
      } catch (error) {
        console.error("Error fetching student detail:", error);
        toast.error("Không thể tải thông tin chi tiết sinh viên.");
        navigate("/lecturer/students");
      } finally {
        setLoading(false);
      }
    };
    fetchStudent();
  }, [id, navigate, toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!data) return null;

  const { student, registration, period, progress, weeklyReports, finalReport, evaluation } = data;
  const initials = student?.FullName?.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "SV";

  return (
    <>
      <div className="topbar">
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button 
            onClick={() => navigate("/lecturer/students")}
            style={{ 
              background: "none", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", 
              padding: "6px 10px", color: "var(--text-secondary)", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s"
            }}
            className="hover:bg-slate-50"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </button>
          <div>
            <div className="topbar-title">Chi tiết Sinh viên</div>
            <div className="topbar-subtitle">
              {student?.FullName} ({student?.StudentCode})
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <button className="btn-primary" style={{ width: "auto", background: "white", color: "var(--text-primary)", border: "1px solid var(--border)", boxShadow: "none" }}>
            Xuất PDF
          </button>
          <button className="btn-primary" style={{ width: "auto" }}>
            Đánh giá
          </button>
        </div>
      </div>

      <div className="page-content">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "24px" }}>
          
          {/* LEFT COLUMN: Profile & Company */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            
            {/* Student Profile Card */}
            <div style={{ background: "var(--bg-card)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)", overflow: "hidden" }}>
              <div style={{ padding: "24px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", borderBottom: "1px solid var(--border)" }}>
                <div style={{ 
                  width: "80px", height: "80px", borderRadius: "50%", marginBottom: "16px",
                  background: "linear-gradient(135deg, var(--primary-light), var(--primary))",
                  color: "white", display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "28px", fontWeight: 700, boxShadow: "0 4px 10px rgba(59,130,246,0.3)"
                }}>
                  {initials}
                </div>
                <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 4px 0", color: "var(--text-primary)" }}>{student?.FullName}</h2>
                <div style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "12px", fontWeight: 500 }}>
                  MSSV: {student?.StudentCode} • Lớp: {student?.ClassName}
                </div>
                
                <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                  <span style={{ 
                    background: student?.Status === "COMPLETED" ? "#dcfce7" : student?.Status === "IN_PROGRESS" ? "#e0f2fe" : "#f1f5f9", 
                    color: student?.Status === "COMPLETED" ? "#166534" : student?.Status === "IN_PROGRESS" ? "#0284c7" : "#64748b", 
                    padding: "4px 12px", borderRadius: "20px", fontWeight: 600, fontSize: "12px", textTransform: "uppercase" 
                  }}>
                    {student?.Status === "COMPLETED" ? "HOÀN THÀNH" : student?.Status === "IN_PROGRESS" ? "ĐANG THỰC TẬP" : "CHƯA BẮT ĐẦU"}
                  </span>
                  {student?.GPA && (
                    <span style={{ background: "#f3f4f6", color: "#4b5563", padding: "4px 12px", borderRadius: "20px", fontWeight: 600, fontSize: "12px" }}>
                      GPA: {student.GPA}
                    </span>
                  )}
                </div>
              </div>
              
              <div style={{ padding: "20px 24px" }}>
                <h3 style={{ fontSize: "14px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "16px", letterSpacing: "0.5px" }}>Thông tin liên hệ</h3>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#f1f5f9", color: "var(--text-secondary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    </div>
                    <div>
                      <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Email</div>
                      <div style={{ fontSize: "14px", color: "var(--text-primary)", fontWeight: 500 }}>{student?.Email}</div>
                    </div>
                  </div>
                  
                  <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#f1f5f9", color: "var(--text-secondary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                    </div>
                    <div>
                      <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Số điện thoại</div>
                      <div style={{ fontSize: "14px", color: "var(--text-primary)", fontWeight: 500 }}>{student?.Phone || "Chưa cập nhật"}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Internship Details Card */}
            <div style={{ background: "var(--bg-card)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)", overflow: "hidden" }}>
              <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--border)", background: "#f8fafc" }}>
                <h3 style={{ fontSize: "15px", fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                  <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  Đơn vị thực tập
                </h3>
              </div>
              
              <div style={{ padding: "20px 24px" }}>
                {registration ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div>
                      <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--primary-dark)", marginBottom: "4px" }}>{registration.CompanyName}</div>
                      <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>{registration.Field || "Lĩnh vực công nghệ thông tin"}</div>
                    </div>
                    
                    <div style={{ height: "1px", background: "var(--border)" }}></div>
                    
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "13.5px" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: "8px" }}>
                        <span style={{ color: "var(--text-muted)" }}>Địa chỉ:</span>
                        <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{registration.Address}</span>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: "8px" }}>
                        <span style={{ color: "var(--text-muted)" }}>Người LH:</span>
                        <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{registration.ContactPerson || "Chưa cập nhật"}</span>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: "8px" }}>
                        <span style={{ color: "var(--text-muted)" }}>Email LH:</span>
                        <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{registration.ContactEmail || "Chưa cập nhật"}</span>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: "8px" }}>
                        <span style={{ color: "var(--text-muted)" }}>Kỳ thực tập:</span>
                        <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{period?.PeriodName}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "16px 0" }}>
                    Sinh viên chưa đăng ký đơn vị thực tập.
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Progress & Reports */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            
            {/* Progress Card */}
            <div style={{ background: "var(--bg-card)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)", padding: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                  <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                  Tiến độ thực tập
                </h3>
                <span style={{ fontSize: "20px", fontWeight: 800, color: "var(--primary)" }}>{progress?.ProgressPercent || 0}%</span>
              </div>
              
              <div style={{ height: "12px", background: "var(--border)", borderRadius: "6px", overflow: "hidden", marginBottom: "16px" }}>
                <div style={{ height: "100%", background: "linear-gradient(90deg, var(--primary-light), var(--primary))", width: `${progress?.ProgressPercent || 0}%`, borderRadius: "6px", transition: "width 1s ease-out" }}></div>
              </div>
              
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "var(--text-muted)" }}>
                <span>Bắt đầu: {period?.StartDate ? new Date(period.StartDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : "N/A"}</span>
                <span>Kết thúc: {period?.EndDate ? new Date(period.EndDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : "N/A"}</span>
              </div>
            </div>

            {/* Reports Card */}
            <div style={{ background: "var(--bg-card)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)", overflow: "hidden", flex: 1 }}>
              <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0 }}>Lịch sử báo cáo</h3>
                <span className="lm-filter-tag" style={{ background: "#eff6ff", color: "var(--primary)", borderColor: "#bfdbfe" }}>
                  {weeklyReports?.length || 0} Báo cáo
                </span>
              </div>
              
              <div style={{ padding: "0" }}>
                {weeklyReports && weeklyReports.length > 0 ? (
                  <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                    {weeklyReports.map((report, idx) => (
                      <li key={idx} style={{ 
                        padding: "20px 24px", 
                        borderBottom: idx < weeklyReports.length - 1 ? "1px solid var(--border)" : "none",
                        display: "grid", gridTemplateColumns: "1fr auto", gap: "16px",
                        transition: "background 0.2s"
                      }} className="hover:bg-slate-50">
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                            <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "14.5px" }}>
                              {report.Title}
                            </div>
                            {report.Status === 'PENDING' && <span style={{ padding: "2px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: 600, background: "#fef3c7", color: "#92400e" }}>Chờ duyệt</span>}
                            {report.Status === 'APPROVED' && <span style={{ padding: "2px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: 600, background: "#dcfce7", color: "#166534" }}>Đã duyệt</span>}
                            {report.Status === 'REVISION_REQUIRED' && <span style={{ padding: "2px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: 600, background: "#fee2e2", color: "#b91c1c" }}>Cần sửa</span>}
                          </div>
                          
                          <div style={{ fontSize: "13px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "16px" }}>
                            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                              Nộp lúc: {new Date(report.SubmittedAt).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                        
                        <div style={{ display: "flex", alignItems: "center" }}>
                          <button className="btn-primary" style={{ padding: "6px 12px", fontSize: "13px", width: "auto" }}>
                            Chấm điểm
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
                    <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    <p>Chưa có báo cáo tuần nào được nộp.</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
};

export default LecturerStudentDetail;
