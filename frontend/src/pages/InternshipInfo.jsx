import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { studentInternshipAPI } from "../services/api";
import { useToast } from "../context/ToastContext";

const fmtDate = (d) => d ? new Date(d).toLocaleDateString("vi-VN") : "—";
const initials = (name = "") => {
  const w = name.trim().split(/\s+/);
  return (w.length >= 2 ? w[0][0] + w[w.length - 1][0] : name.slice(0, 2)).toUpperCase() || "?";
};

const STATUS_CFG = {
  NOT_STARTED: { label: "Chưa bắt đầu", bg: "#f1f5f9", color: "#64748b", pct: 10 },
  IN_PROGRESS:  { label: "Đang thực tập", bg: "#eff6ff", color: "#2563eb", pct: 55 },
  COMPLETED:    { label: "Hoàn thành",   bg: "#dcfce7", color: "#16a34a", pct: 100 },
};

const RPT_STATUS = {
  PENDING:           { label: "Chờ duyệt",     bg: "#fef3c7", color: "#92400e" },
  APPROVED:          { label: "Đã duyệt",       bg: "#dcfce7", color: "#166534" },
  REJECTED:          { label: "Bị từ chối",     bg: "#fee2e2", color: "#991b1b" },
  REVISION_REQUIRED: { label: "Cần chỉnh sửa", bg: "#ffedd5", color: "#9a3412" },
};

// ─── Small helpers ────────────────────────────────────────────────────────────
const SectionCard = ({ children, style }) => (
  <div style={{ background: "var(--bg-card)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)", overflow: "hidden", ...style }}>
    {children}
  </div>
);

const CardHead = ({ icon, title, accent = "var(--primary)" }) => (
  <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 12, background: "#f8fafc" }}>
    <div style={{ width: 34, height: 34, borderRadius: 8, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: accent, flexShrink: 0 }}>
      {icon}
    </div>
    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>{title}</h3>
  </div>
);

const InfoRow = ({ label, value }) => (
  <div style={{ padding: "12px 0", borderBottom: "1px solid #f1f5f9" }}>
    <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 3 }}>{label}</div>
    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{value || "—"}</div>
  </div>
);

// ─── Hero Banner ──────────────────────────────────────────────────────────────
const HeroCard = ({ student, registration, assignment, weeklyReports, finalReport, evaluation, templatesData }) => {
  let internshipStatus = "Chưa đăng ký";
  let statusColor = "#64748b"; 
  let statusBg = "#f1f5f9"; 
  let progressPercent = 0;

  if (registration) {
    if (assignment) {
      const approvedWeekly = weeklyReports?.filter(r => r.Status === 'APPROVED').length || 0;
      const totalApproved = approvedWeekly + (finalReport?.Status === 'APPROVED' ? 1 : 0);
      const totalTemplates = templatesData?.length > 0 ? templatesData.length : 1; 
      
      progressPercent = Math.min(Math.round((totalApproved / totalTemplates) * 100), 100); 

      if (evaluation) {
        internshipStatus = "Đã hoàn thành";
        statusColor = "#166534"; 
        statusBg = "#dcfce7"; 
      } else {
        internshipStatus = "Đang thực tập";
        statusColor = "#1e40af"; 
        statusBg = "#dbeafe"; 
      }
    } else {
      internshipStatus = "Chờ phân công GV";
      statusColor = "#92400e"; 
      statusBg = "#fef3c7"; 
      progressPercent = 0;
    }
  }

  return (
    <div style={{ background: "linear-gradient(135deg, #1e40af 0%, #2563eb 60%, #3b82f6 100%)", borderRadius: "var(--radius-lg)", padding: "28px 32px", display: "flex", flexWrap: "wrap", alignItems: "center", gap: 24, boxShadow: "0 6px 24px rgba(37,99,235,0.2)" }}>
      {/* Avatar + Name */}
      <div style={{ display: "flex", alignItems: "center", gap: 20, flex: 1, minWidth: 200 }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, background: "rgba(255,255,255,0.15)", color: "white", fontWeight: 700, fontSize: 22, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {initials(student?.FullName || "")}
        </div>
        <div>
          <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 6 }}>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "white" }}>{student?.FullName || "Sinh viên"}</h1>
            <span style={{ background: statusBg, color: statusColor, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>{internshipStatus}</span>
          </div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.75)" }}>
            MSSV: <strong style={{ color: "white" }}>{student?.StudentCode}</strong>
            {" · "}Lớp: <strong style={{ color: "white" }}>{student?.ClassName || "—"}</strong>
          </div>
        </div>
      </div>
      {/* Progress */}
      <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 12, padding: "14px 20px", minWidth: 180, flexShrink: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>Tiến độ</span>
          <span style={{ fontSize: 28, fontWeight: 800, color: "white", lineHeight: 1 }}>{progressPercent}%</span>
        </div>
        <div style={{ height: 6, background: "rgba(255,255,255,0.2)", borderRadius: 4, overflow: "hidden", marginBottom: 6 }}>
          <div style={{ height: "100%", width: `${progressPercent}%`, background: "white", borderRadius: 4 }} />
        </div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>{internshipStatus}</div>
      </div>
    </div>
  );
};

// ─── Company Card ─────────────────────────────────────────────────────────────
const CompanyCard = ({ reg }) => (
  <SectionCard>
    <CardHead icon="🏢" title="Công ty thực tập" />
    <div style={{ padding: "20px 24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid var(--border)" }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: "var(--primary)", color: "white", fontWeight: 700, fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {initials(reg.CompanyName)}
        </div>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>{reg.CompanyName}</div>
          {reg.Field && <span style={{ background: "#eff6ff", color: "var(--primary)", fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 6 }}>{reg.Field}</span>}
        </div>
      </div>
      <InfoRow label="Địa chỉ" value={reg.Address} />
      <InfoRow label="Email liên hệ" value={reg.ContactEmail} />
      <InfoRow label="Điện thoại" value={reg.ContactPhone} />
      <InfoRow label="Người liên hệ" value={reg.ContactPerson} />
    </div>
  </SectionCard>
);

// ─── Lecturer Card ────────────────────────────────────────────────────────────
const LecturerCard = ({ assignment }) => (
  <SectionCard>
    <CardHead icon="👨‍🏫" title="Giảng viên hướng dẫn" />
    <div style={{ padding: "20px 24px" }}>
      {assignment ? (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid var(--border)" }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#f1f5f9", color: "#64748b", fontWeight: 700, fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {initials(assignment.LecturerName)}
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 2 }}>{assignment.LecturerName}</div>
              <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{assignment.LecturerCode}</div>
            </div>
          </div>
          <InfoRow label="Khoa / Bộ môn" value={assignment.Department} />
          <InfoRow label="Email" value={assignment.LecturerEmail} />
          <InfoRow label="Điện thoại" value={assignment.LecturerPhone} />
          <InfoRow label="SV đang hướng dẫn" value={`${assignment.SupervisedCount} sinh viên`} />
        </>
      ) : (
        <div style={{ textAlign: "center", padding: "32px 20px" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", marginBottom: 6 }}>Chờ phân công</div>
          <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Admin sẽ sớm phân công giảng viên hướng dẫn cho bạn.</div>
        </div>
      )}
    </div>
  </SectionCard>
);

// ─── Period Card ──────────────────────────────────────────────────────────────
const PeriodCard = ({ reg }) => {
  const STATUS_MAP = {
    ACTIVE:   { label: "Đang mở",     bg: "#dcfce7", color: "#166534" },
    CLOSED:   { label: "Đã kết thúc", bg: "#f1f5f9", color: "#64748b" },
    UPCOMING: { label: "Sắp mở",      bg: "#eff6ff", color: "#1d4ed8" },
  };
  const s = STATUS_MAP[reg.PeriodStatus] || STATUS_MAP.UPCOMING;
  return (
    <SectionCard>
      <CardHead icon="📅" title="Đợt thực tập" accent="#16a34a" />
      <div style={{ padding: "20px 24px" }}>
        <div style={{ marginBottom: 16, paddingBottom: 14, borderBottom: "1px solid var(--border)" }}>
          <span style={{ background: s.bg, color: s.color, fontSize: 12, fontWeight: 700, padding: "5px 14px", borderRadius: 20 }}>{s.label}</span>
        </div>
        <InfoRow label="Tên đợt" value={reg.PeriodName} />
        <InfoRow label="Học kỳ" value={`Học kỳ ${reg.Semester}`} />
        <InfoRow label="Năm học" value={reg.AcademicYear} />
        <InfoRow label="Bắt đầu" value={fmtDate(reg.StartDate)} />
        <InfoRow label="Kết thúc" value={fmtDate(reg.EndDate)} />
      </div>
    </SectionCard>
  );
};

// ─── Progress Card ────────────────────────────────────────────────────────────
const ProgressCard = ({ weeklyReports, finalReport, evaluation }) => {
  const approved = weeklyReports.filter(r => r.Status === "APPROVED").length;
  const pending  = weeklyReports.filter(r => r.Status === "PENDING").length;
  const total    = weeklyReports.length;
  const stats = [
    { label: "BC tuần đã nộp", val: total,    bg: "#eff6ff", color: "#1d4ed8" },
    { label: "Đã được duyệt",  val: approved, bg: "#dcfce7", color: "#166534" },
    { label: "Chờ duyệt",      val: pending,  bg: "#fef3c7", color: "#92400e" },
    { label: "Điểm tổng kết",  val: evaluation?.TotalScore ?? "—", bg: "#f8fafc", color: "#334155" },
  ];
  return (
    <SectionCard>
      <CardHead icon="📊" title="Tiến độ thực tập" />
      <div style={{ padding: "20px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
          {stats.map(({ label, val, bg, color }) => (
            <div key={label} style={{ background: bg, borderRadius: 12, padding: "16px 18px" }}>
              <div style={{ fontSize: 32, fontWeight: 800, color, lineHeight: 1, marginBottom: 6 }}>{val}</div>
              <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>{label}</div>
            </div>
          ))}
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 10 }}>Trạng thái báo cáo</div>
          {[
            { label: "Báo cáo tổng kết", status: finalReport?.Status },
            { label: "Kết quả đánh giá", status: evaluation ? "APPROVED" : null },
          ].map(({ label, status }) => {
            const c = status ? RPT_STATUS[status] : null;
            return (
              <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: "#f8fafc", borderRadius: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>{label}</span>
                {c ? <span style={{ background: c.bg, color: c.color, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>{c.label}</span>
                   : <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Chưa có</span>}
              </div>
            );
          })}
        </div>
      </div>
    </SectionCard>
  );
};

// ─── Timeline Section ─────────────────────────────────────────────────────────
const TimelineSection = ({ registration, assignment, weeklyReports, finalReport, evaluation }) => {
  const events = [
    { label: "Đăng ký công ty thực tập", desc: registration?.CompanyName, date: registration?.RegisteredAt, done: !!registration },
    { label: "Phân công giảng viên", desc: assignment?.LecturerName || "Chờ Admin phân công", date: assignment?.AssignedDate, done: !!assignment },
    { label: `Nộp báo cáo tuần (${weeklyReports.length} báo cáo)`, desc: weeklyReports.length ? `${weeklyReports.filter(r => r.Status === "APPROVED").length}/${weeklyReports.length} báo cáo được duyệt` : "Chưa có báo cáo", date: weeklyReports.at?.(-1)?.SubmittedAt, done: weeklyReports.length > 0 },
    { label: "Nộp báo cáo tổng kết", desc: finalReport ? (RPT_STATUS[finalReport.Status]?.label || "Đã nộp") : "Chưa nộp", date: finalReport?.SubmittedAt, done: !!finalReport },
    { label: "Hoàn thành thực tập", desc: evaluation ? `Điểm tổng kết: ${evaluation.TotalScore}/10` : "Chờ đánh giá cuối kỳ", date: evaluation?.EvaluatedAt, done: !!evaluation },
  ];
  return (
    <SectionCard>
      <CardHead icon="🗓️" title="Tiến trình thực tập" />
      <div style={{ padding: "24px 32px" }}>
        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute", left: 19, top: 0, bottom: 0, width: 2, background: "#f1f5f9" }} />
          {events.map((ev, i) => (
            <div key={i} style={{ position: "relative", display: "flex", gap: 24, paddingBottom: i < events.length - 1 ? 32 : 0 }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", border: ev.done ? "2px solid var(--primary)" : "2px solid #e2e8f0", background: ev.done ? "var(--primary)" : "white", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, zIndex: 1, fontSize: ev.done ? 16 : 12 }}>
                {ev.done ? "✓" : <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#cbd5e1" }} />}
              </div>
              <div style={{ paddingTop: 8, flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: ev.done ? "var(--text-primary)" : "#94a3b8", marginBottom: 4 }}>{ev.label}</div>
                <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>{ev.desc}</div>
                {ev.date && <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>{fmtDate(ev.date)}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </SectionCard>
  );
};

// ─── Weekly Reports List ──────────────────────────────────────────────────────
const WeeklyReportsList = ({ reports }) => {
  if (!reports.length) return null;
  return (
    <SectionCard>
      <CardHead icon="📋" title={`Danh sách báo cáo tuần (${reports.length})`} />
      <div style={{ padding: "12px 24px 20px" }}>
        {reports.map((r) => {
          const c = RPT_STATUS[r.Status] || RPT_STATUS.PENDING;
          return (
            <div key={r.ReportId} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 12px", borderRadius: 10, transition: "background 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "#eff6ff", color: "var(--primary)", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {r.WeekNumber}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 2 }}>{r.Title || `Báo cáo tuần ${r.WeekNumber}`}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{fmtDate(r.SubmittedAt)}</div>
                </div>
              </div>
              <span style={{ background: c.bg, color: c.color, fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 20 }}>{c.label}</span>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
};

// ─── Evaluation Card ──────────────────────────────────────────────────────────
const EvaluationCard = ({ evaluation }) => {
  if (!evaluation) return null;
  const scores = [
    { label: "Quá trình", val: evaluation.ProcessScore },
    { label: "BC tuần",   val: evaluation.WeeklyReportScore },
    { label: "BC cuối kỳ",val: evaluation.FinalReportScore },
    { label: "Thái độ",   val: evaluation.AttitudeScore },
    { label: "Tổng kết",  val: evaluation.TotalScore },
  ];
  return (
    <SectionCard>
      <CardHead icon="⭐" title="Kết quả đánh giá" accent="#f59e0b" />
      <div style={{ padding: "20px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 16 }}>
          {scores.map(({ label, val }) => (
            <div key={label} style={{ background: "#eff6ff", borderRadius: 12, padding: 14, textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: "var(--primary)", lineHeight: 1, marginBottom: 6 }}>{val ?? "—"}</div>
              <div style={{ fontSize: 11, color: "#64748b", fontWeight: 500 }}>{label}</div>
            </div>
          ))}
        </div>
        {evaluation.Comment && (
          <div style={{ background: "#f8fafc", borderRadius: 10, padding: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", marginBottom: 6 }}>Nhận xét giảng viên</div>
            <div style={{ fontSize: 14, color: "var(--text-primary)", lineHeight: 1.6 }}>{evaluation.Comment}</div>
          </div>
        )}
      </div>
    </SectionCard>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const InternshipInfo = () => {
  const toast = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);
  const [registration, setReg] = useState(null);
  const [assignment, setAssign] = useState(null);
  const [weeklyReports, setWeekly] = useState([]);
  const [finalReport, setFinal] = useState(null);
  const [evaluation, setEval] = useState(null);
  const [templatesData, setTemplatesData] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const [infoRes, reportsRes] = await Promise.all([
          studentInternshipAPI.getMyInternshipInfo(),
          studentInternshipAPI.getReports().catch(() => ({ data: { data: [] } }))
        ]);
        const d = infoRes.data.data;
        setStudent(d.student);
        setReg(d.registration);
        setAssign(d.assignment);
        setWeekly(d.weeklyReports || []);
        setFinal(d.finalReport);
        setEval(d.evaluation);
        if (reportsRes.data?.success) {
          setTemplatesData(reportsRes.data.data);
        }
      } catch {
        toast.error("Không thể tải thông tin thực tập.");
      } finally {
        setLoading(false);
      }
    })();
  }, [toast]);

  if (loading) return (
    <>
      <div className="topbar"><div><div className="topbar-title">Thông tin thực tập</div><div className="topbar-subtitle">Theo dõi tiến độ và thông tin đợt thực tập của bạn</div></div></div>
      <div className="page-content" style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
        <div className="spinner" />
      </div>
    </>
  );

  return (
    <>
      <div className="topbar">
        <div>
          <div className="topbar-title">Thông tin thực tập</div>
          <div className="topbar-subtitle">Theo dõi tiến độ và thông tin đợt thực tập của bạn</div>
        </div>
      </div>

      <div className="page-content">
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {!registration ? (
            <SectionCard>
              <div style={{ padding: "56px 24px", textAlign: "center" }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🏢</div>
                <h3 style={{ margin: "0 0 8px 0", fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>Bạn chưa đăng ký thực tập</h3>
                <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 24 }}>Hãy đăng ký công ty thực tập để bắt đầu theo dõi tiến độ.</p>
                <button onClick={() => navigate("/student/register-internship")} className="btn-primary" style={{ width: "auto", padding: "10px 24px" }}>
                  Đi tới Đăng ký thực tập
                </button>
              </div>
            </SectionCard>
          ) : (
            <>
              <HeroCard 
                student={student} 
                registration={registration} 
                assignment={assignment} 
                weeklyReports={weeklyReports} 
                finalReport={finalReport} 
                evaluation={evaluation} 
                templatesData={templatesData} 
              />

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                <CompanyCard reg={registration} />
                <LecturerCard assignment={assignment} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                <PeriodCard reg={registration} />
                <ProgressCard weeklyReports={weeklyReports} finalReport={finalReport} evaluation={evaluation} />
              </div>

              <TimelineSection registration={registration} assignment={assignment} weeklyReports={weeklyReports} finalReport={finalReport} evaluation={evaluation} />
              <WeeklyReportsList reports={weeklyReports} />
              <EvaluationCard evaluation={evaluation} />
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default InternshipInfo;
