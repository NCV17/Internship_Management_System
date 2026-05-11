import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { lecturerDashboardAPI } from "../services/api";
import { useToast } from "../context/ToastContext";

const fmtDate = (d) => d ? new Date(d).toLocaleDateString("vi-VN") : "—";

const STATUS_CFG = {
  NOT_STARTED: { label: "Chưa bắt đầu", bg: "#f1f5f9", color: "#64748b" },
  IN_PROGRESS:  { label: "Đang thực tập", bg: "#e0f2fe", color: "#0284c7" },
  COMPLETED:    { label: "Hoàn thành",   bg: "#dcfce7", color: "#166534" },
};

const initials = (name = "") => name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "SV";

const LecturerStudents = () => {
  const toast = useToast();

  const [students, setStudents]     = useState([]);
  const [periods, setPeriods]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatus]   = useState("");
  const [periodFilter, setPeriod]   = useState("");

  // Load filter options (periods) once
  useEffect(() => {
    lecturerDashboardAPI.getFilterOptions()
      .then(res => {
        const p = res.data.data?.periods || [];
        setPeriods(p);
        // Default to first ACTIVE period if any
        const active = p.find(x => x.Status === "ACTIVE") || p[0];
        if (active) setPeriod(String(active.PeriodId));
      })
      .catch(() => {});
  }, []);

  // Fetch students whenever filters change
  useEffect(() => {
    fetchStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodFilter, statusFilter]);

  const fetchStudents = async (search = searchTerm) => {
    try {
      setLoading(true);
      const params = {};
      if (search)       params.search   = search;
      if (statusFilter) params.status   = statusFilter;
      if (periodFilter) params.periodId = periodFilter;
      const res = await lecturerDashboardAPI.getStudents(params);
      setStudents(res.data.data || []);
    } catch {
      toast.error("Không thể tải danh sách sinh viên.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => { e.preventDefault(); fetchStudents(searchTerm); };

  const handleClear = () => {
    setSearchTerm(""); setStatus(""); setPeriod("");
    setTimeout(() => lecturerDashboardAPI.getStudents().then(r => setStudents(r.data.data || [])), 0);
  };

  // Summary stats
  const stats = {
    total:      students.length,
    inProgress: students.filter(s => s.internshipStatus === "IN_PROGRESS").length,
    completed:  students.filter(s => s.internshipStatus === "COMPLETED").length,
    pending:    students.reduce((n, s) => n + (s.submittedReports || 0), 0),
  };

  return (
    <>
      <div className="topbar">
        <div>
          <div className="topbar-title">Sinh viên hướng dẫn</div>
          <div className="topbar-subtitle">Danh sách sinh viên được phân công hướng dẫn thực tập.</div>
        </div>
        <span style={{ background: "#eff6ff", color: "var(--primary)", fontSize: 12, fontWeight: 700, padding: "5px 14px", borderRadius: 20, border: "1px solid #bfdbfe" }}>GIẢNG VIÊN</span>
      </div>

      <div className="page-content">
        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 20 }}>
          {[
            { label: "Tổng sinh viên",   val: stats.total,      bg: "#eff6ff", color: "#1d4ed8" },
            { label: "Đang thực tập",    val: stats.inProgress, bg: "#e0f2fe", color: "#0284c7" },
            { label: "Hoàn thành",       val: stats.completed,  bg: "#dcfce7", color: "#166534" },
            { label: "Báo cáo đã nộp",   val: stats.pending,    bg: "#fef3c7", color: "#92400e" },
          ].map(({ label, val, bg, color }) => (
            <div key={label} style={{ background: "var(--bg-card)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)", padding: "16px 20px", display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800, color, flexShrink: 0 }}>{val}</div>
              <div style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 500 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Filter bar */}
        <div style={{ background: "var(--bg-card)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)", padding: "18px 20px", marginBottom: 20 }}>
          <form onSubmit={handleSearch} style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "flex-end" }}>
            {/* Search */}
            <div style={{ flex: 1, minWidth: 220 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 6 }}>Tìm kiếm</div>
              <input
                type="text"
                placeholder="MSSV, họ tên sinh viên..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ width: "100%", padding: "9px 14px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box", background: "white" }}
              />
            </div>

            {/* Period filter */}
            <div style={{ width: 220 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 6 }}>Đợt thực tập</div>
              <select className="form-input form-input-no-icon" value={periodFilter} onChange={e => setPeriod(e.target.value)} style={{ padding: "9px 14px" }}>
                <option value="">Tất cả đợt</option>
                {periods.map(p => <option key={p.PeriodId} value={String(p.PeriodId)}>{p.PeriodName}</option>)}
              </select>
            </div>

            {/* Status filter */}
            <div style={{ width: 190 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 6 }}>Trạng thái</div>
              <select className="form-input form-input-no-icon" value={statusFilter} onChange={e => setStatus(e.target.value)} style={{ padding: "9px 14px" }}>
                <option value="">Tất cả trạng thái</option>
                <option value="NOT_STARTED">Chưa bắt đầu</option>
                <option value="IN_PROGRESS">Đang thực tập</option>
                <option value="COMPLETED">Hoàn thành</option>
              </select>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button type="submit" className="btn-primary" style={{ padding: "9.5px 20px", width: "auto" }}>Lọc</button>
              {(searchTerm || statusFilter || periodFilter) && (
                <button type="button" onClick={handleClear} className="btn-primary" style={{ padding: "9.5px 14px", width: "auto", background: "var(--bg-page)", color: "var(--text-primary)", border: "1px solid var(--border)", boxShadow: "none" }}>Xóa lọc</button>
              )}
            </div>
          </form>
        </div>

        {/* Student list */}
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}><div className="spinner" /></div>
        ) : students.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {students.map((s) => {
              const cfg = STATUS_CFG[s.internshipStatus] || STATUS_CFG.NOT_STARTED;
              return (
                <div key={s.studentId} style={{ background: "var(--bg-card)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)", padding: "18px 24px", display: "grid", gridTemplateColumns: "200px 1fr auto", gap: 24, alignItems: "center", transition: "box-shadow 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = "var(--shadow-md)"}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = "var(--shadow-sm)"}
                >
                  {/* LEFT: Student identity */}
                  <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                    <div style={{ width: 50, height: 50, borderRadius: "50%", background: "linear-gradient(135deg, var(--primary-light), var(--primary))", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, fontWeight: 700, flexShrink: 0 }}>
                      {initials(s.fullName)}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 3 }}>{s.fullName}</div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{s.studentCode} · {s.className}</div>
                    </div>
                  </div>

                  {/* CENTER: Internship info */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>
                      {s.companyName || <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>Chưa có đơn vị thực tập</span>}
                    </div>
                    <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{s.periodName || "—"}</span>
                      <span style={{ background: cfg.bg, color: cfg.color, fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 12 }}>{cfg.label}</span>
                      {s.hasEvaluation && <span style={{ background: "#dcfce7", color: "#166534", fontSize: 11, fontWeight: 600, padding: "2px 9px", borderRadius: 12 }}>Đã đánh giá</span>}
                    </div>
                    {/* Progress bar */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ flex: 1, height: 5, background: "#f1f5f9", borderRadius: 3, overflow: "hidden", maxWidth: 200 }}>
                        <div style={{ height: "100%", width: `${s.progressPercent || 0}%`, background: "var(--primary)", borderRadius: 3, transition: "width 0.5s" }} />
                      </div>
                      <span style={{ fontSize: 12, color: "var(--primary)", fontWeight: 600, minWidth: 36 }}>{s.progressPercent || 0}%</span>
                      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{s.submittedReports} báo cáo</span>
                    </div>
                  </div>

                  {/* RIGHT: Action */}
                  <div>
                    <Link to={`/lecturer/students/${s.studentId}`} className="btn-primary" style={{ padding: "8px 18px", fontSize: 13, width: "auto", whiteSpace: "nowrap" }}>
                      Chi tiết
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ background: "var(--bg-card)", borderRadius: "var(--radius-lg)", border: "1px dashed var(--border)", padding: "60px 20px", textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
            <h3 style={{ fontSize: 17, fontWeight: 600, color: "var(--text-primary)", marginBottom: 8 }}>Không tìm thấy sinh viên</h3>
            <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
              {searchTerm || statusFilter || periodFilter ? "Thử thay đổi bộ lọc để xem kết quả khác." : "Chưa có sinh viên nào được phân công cho bạn trong đợt này."}
            </p>
            {(searchTerm || statusFilter || periodFilter) && (
              <button onClick={handleClear} className="btn-primary" style={{ marginTop: 16, width: "auto", background: "var(--bg-page)", color: "var(--text-primary)", border: "1px solid var(--border)", boxShadow: "none" }}>Xóa bộ lọc</button>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default LecturerStudents;
