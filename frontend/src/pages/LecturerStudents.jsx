import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { lecturerDashboardAPI } from "../services/api";
import { useToast } from "../context/ToastContext";

const LecturerStudents = () => {
  const toast = useToast();
  
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  
  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await lecturerDashboardAPI.getStudents();
      setStudents(res.data.data);
    } catch (error) {
      console.error("Error fetching students:", error);
      toast.error("Không thể tải danh sách sinh viên.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchFiltered();
  };

  const fetchFiltered = async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (statusFilter) params.status = statusFilter;
      
      const res = await lecturerDashboardAPI.getStudents(params);
      setStudents(res.data.data);
    } catch (error) {
      console.error("Error filtering students:", error);
      toast.error("Không thể tải danh sách sinh viên.");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setSearchTerm("");
    setStatusFilter("");
    fetchStudents(); // Reset filter calls fetch without params (or with empty states, but since they are updated async, call directly without params)
    
    // Quick async refetch:
    setTimeout(() => {
      lecturerDashboardAPI.getStudents().then(res => setStudents(res.data.data));
    }, 0);
  };

  return (
    <>
      <div className="topbar">
        <div>
          <div className="topbar-title">Sinh viên hướng dẫn</div>
          <div className="topbar-subtitle">
            Danh sách sinh viên được phân công hướng dẫn thực tập.
          </div>
        </div>
        <span className="role-badge lecturer">GIẢNG VIÊN</span>
      </div>

      <div className="page-content">
        {/* FILTER BAR */}
        <div className="lm-table-card" style={{ padding: "20px", marginBottom: "24px" }}>
          <form onSubmit={handleSearch} style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "flex-end" }}>
            <div style={{ flex: "1", minWidth: "250px" }}>
              <label className="form-label" style={{ marginBottom: "8px" }}>Tìm kiếm</label>
              <div className="lm-search-wrapper" style={{ maxWidth: "100%" }}>
                <svg className="lm-search-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input
                  type="text"
                  className="lm-search-input"
                  placeholder="MSSV, Họ tên sinh viên..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div style={{ width: "200px" }}>
              <label className="form-label" style={{ marginBottom: "8px" }}>Trạng thái thực tập</label>
              <select 
                className="form-input form-input-no-icon" 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ padding: "9px 14px" }}
              >
                <option value="">Tất cả trạng thái</option>
                <option value="NOT_STARTED">Chưa bắt đầu</option>
                <option value="IN_PROGRESS">Đang thực tập</option>
                <option value="COMPLETED">Hoàn thành</option>
              </select>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button type="submit" className="btn-primary" style={{ padding: "9.5px 20px", width: "auto" }}>
                Lọc kết quả
              </button>
              {(searchTerm || statusFilter) && (
                <button type="button" onClick={handleClear} className="btn-primary" style={{ padding: "9.5px 20px", width: "auto", background: "var(--bg-page)", color: "var(--text-primary)", border: "1px solid var(--border)", boxShadow: "none" }}>
                  Xóa lọc
                </button>
              )}
            </div>
          </form>
        </div>

        {/* STUDENT LIST (CARD HYBRID LAYOUT) */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="spinner" style={{ borderColor: "rgba(59,130,246,0.3)", borderTopColor: "var(--primary)" }}></div>
          </div>
        ) : students.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {students.map((student) => {
              
              // Helper components for UI
              const initials = student.fullName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
              
              let statusText = "Chưa bắt đầu";
              let statusColor = "#64748b";
              let statusBg = "#f1f5f9";
              
              if (student.internshipStatus === "IN_PROGRESS") {
                statusText = "Đang thực tập";
                statusColor = "#0284c7";
                statusBg = "#e0f2fe";
              } else if (student.internshipStatus === "COMPLETED") {
                statusText = "Hoàn thành";
                statusColor = "#166534";
                statusBg = "#dcfce7";
              }

              return (
                <div key={student.studentId} style={{ 
                  background: "var(--bg-card)", 
                  borderRadius: "var(--radius-lg)", 
                  border: "1px solid var(--border)", 
                  boxShadow: "var(--shadow-sm)", 
                  padding: "20px 24px",
                  display: "grid",
                  gridTemplateColumns: "1.5fr 2fr 1fr",
                  gap: "24px",
                  alignItems: "center",
                  transition: "transform 0.2s, box-shadow 0.2s"
                }} className="hover:shadow-md hover:-translate-y-0.5">
                  
                  {/* LEFT: Student Info */}
                  <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                    <div style={{ 
                      width: "56px", height: "56px", borderRadius: "50%", 
                      background: "linear-gradient(135deg, var(--primary-light), var(--primary))",
                      color: "white", display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "18px", fontWeight: 700, flexShrink: 0
                    }}>
                      {initials}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <h3 style={{ margin: "0 0 4px 0", fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {student.fullName}
                      </h3>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--text-secondary)" }}>
                        <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{student.studentCode}</span>
                        <span style={{ color: "var(--border)" }}>|</span>
                        <span>{student.className}</span>
                      </div>
                    </div>
                  </div>

                  {/* CENTER: Internship Details */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                      <svg className="w-5 h-5 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ marginTop: "1px" }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                      <div style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-primary)" }}>
                        {student.companyName || <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>Chưa có đơn vị thực tập</span>}
                      </div>
                    </div>
                    
                    <div style={{ display: "flex", gap: "16px", fontSize: "13px", color: "var(--text-muted)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        {student.periodName || "Chưa phân công"}
                      </div>
                      <div style={{ 
                        background: statusBg, color: statusColor, 
                        padding: "2px 8px", borderRadius: "12px", 
                        fontWeight: 600, fontSize: "11px", textTransform: "uppercase" 
                      }}>
                        {statusText}
                      </div>
                    </div>
                  </div>

                  {/* RIGHT: Progress & Actions */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "flex-end" }}>
                    
                    <div style={{ width: "100%", maxWidth: "160px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px", fontWeight: 600 }}>
                        <span style={{ color: "var(--text-secondary)" }}>Tiến độ</span>
                        <span style={{ color: "var(--primary)" }}>{student.progressPercent}%</span>
                      </div>
                      <div style={{ height: "6px", background: "var(--border)", borderRadius: "3px", overflow: "hidden" }}>
                        <div style={{ height: "100%", background: "var(--primary)", width: `${student.progressPercent}%`, borderRadius: "3px" }}></div>
                      </div>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px", textAlign: "right" }}>
                        Đã nộp {student.submittedReports} báo cáo
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "8px" }}>
                      <button className="btn-primary" style={{ padding: "6px 12px", fontSize: "12px", width: "auto", background: "white", color: "var(--text-primary)", border: "1px solid var(--border)", boxShadow: "none" }}>
                        Xem báo cáo
                      </button>
                      <Link to={`/lecturer/students/${student.studentId}`} className="btn-primary" style={{ padding: "6px 12px", fontSize: "12px", width: "auto" }}>
                        Chi tiết
                      </Link>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ 
            background: "var(--bg-card)", 
            borderRadius: "var(--radius)", 
            border: "1px dashed var(--border)", 
            padding: "60px 20px", 
            textAlign: "center",
            display: "flex", flexDirection: "column", alignItems: "center"
          }}>
            <svg className="w-16 h-16 text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            <h3 style={{ fontSize: "18px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "8px" }}>Không tìm thấy sinh viên</h3>
            <p style={{ color: "var(--text-muted)", maxWidth: "400px" }}>
              {searchTerm || statusFilter 
                ? "Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm để xem kết quả khác."
                : "Chưa có sinh viên nào được phân công cho bạn hướng dẫn trong kỳ này."}
            </p>
            {(searchTerm || statusFilter) && (
              <button onClick={handleClear} className="btn-primary" style={{ marginTop: "16px", width: "auto", background: "var(--bg-page)", color: "var(--text-primary)", border: "1px solid var(--border)", boxShadow: "none" }}>
                Xóa bộ lọc
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default LecturerStudents;
