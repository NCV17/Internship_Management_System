import { useState, useEffect } from "react";
import { studentInternshipAPI } from "../services/api";
import { useToast } from "../context/ToastContext";

const fmt = (d) => d ? new Date(d).toLocaleDateString("vi-VN", { day:"2-digit", month:"2-digit", year:"numeric" }) : "—";

const classify = (score) => {
  if (score == null || isNaN(score)) return null;
  if (score >= 9)   return { label:"Xuất sắc",   bg:"#dcfce7", color:"#166534", accent:"#22c55e" };
  if (score >= 8)   return { label:"Giỏi",        bg:"#dbeafe", color:"#1d4ed8", accent:"#3b82f6" };
  if (score >= 6.5) return { label:"Khá",          bg:"#fef9c3", color:"#713f12", accent:"#eab308" };
  return                   { label:"Trung bình",   bg:"#fee2e2", color:"#991b1b", accent:"#ef4444" };
};

const ScoreCard = ({ label, value }) => (
  <div style={{ background:"#f8fafc", borderRadius:12, padding:"16px", textAlign:"center", border:"1px solid var(--border)" }}>
    <div style={{ fontSize:28, fontWeight:800, color:"var(--primary)", marginBottom:4 }}>
      {value != null ? Number(value).toFixed(1) : "—"}
    </div>
    <div style={{ fontSize:12, color:"var(--text-muted)", fontWeight:500 }}>{label}</div>
  </div>
);

const StudentEvaluationResults = () => {
  const toast = useToast();
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    studentInternshipAPI.getEvaluationResult()
      .then(res => setEvaluations(res.data.data || []))
      .catch(() => toast.error("Không thể tải kết quả đánh giá."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display:"flex", justifyContent:"center", padding:80 }}>
      <div className="spinner"/>
    </div>
  );

  return (
    <>
      <div className="topbar">
        <div>
          <div className="topbar-title">Kết quả đánh giá thực tập</div>
          <div className="topbar-subtitle">Kết quả đánh giá cuối kỳ từ giảng viên hướng dẫn.</div>
        </div>
      </div>

      <div className="page-content">
        {evaluations.length === 0 ? (
          /* Empty state */
          <div style={{ background:"var(--bg-card)", borderRadius:16, border:"1px dashed var(--border)", padding:"80px 40px", textAlign:"center", maxWidth:520, margin:"40px auto" }}>
            <div style={{ fontSize:64, marginBottom:16 }}>📋</div>
            <h2 style={{ fontSize:20, fontWeight:700, color:"var(--text-primary)", marginBottom:10 }}>Chưa có kết quả đánh giá</h2>
            <p style={{ color:"var(--text-muted)", fontSize:15, lineHeight:1.6 }}>
              Chưa có kết quả đánh giá từ giảng viên.<br/>Kết quả sẽ xuất hiện sau khi giảng viên hoàn thành đánh giá thực tập.
            </p>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:24, maxWidth:800, margin:"0 auto" }}>
            {evaluations.map((ev) => {
              const cls = classify(ev.TotalScore);
              return (
                <div key={ev.EvaluationId} style={{ background:"var(--bg-card)", borderRadius:16, border:"1px solid var(--border)", boxShadow:"var(--shadow-sm)", overflow:"hidden" }}>
                  {/* Header band */}
                  <div style={{ background:`linear-gradient(135deg, ${cls?.accent||"var(--primary)"}, ${cls?.accent||"var(--primary)"}cc)`, padding:"24px 28px", color:"white" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:12 }}>
                      <div>
                        <div style={{ fontSize:13, opacity:0.85, marginBottom:4 }}>{ev.PeriodName} · {ev.AcademicYear}</div>
                        <div style={{ fontSize:20, fontWeight:700 }}>Kết quả đánh giá thực tập</div>
                        <div style={{ fontSize:13, opacity:0.85, marginTop:4 }}>
                          Giảng viên: {ev.LecturerName}{ev.Department ? ` · ${ev.Department}` : ""}
                        </div>
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <div style={{ fontSize:48, fontWeight:900, lineHeight:1 }}>
                          {ev.TotalScore != null ? Number(ev.TotalScore).toFixed(1) : "—"}
                        </div>
                        <div style={{ fontSize:12, opacity:0.8 }}>/ 10</div>
                        {cls && (
                          <div style={{ background:"rgba(255,255,255,0.25)", backdropFilter:"blur(4px)", fontSize:12, fontWeight:700, padding:"4px 12px", borderRadius:20, marginTop:6, display:"inline-block" }}>
                            {cls.label}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ padding:"24px 28px", display:"flex", flexDirection:"column", gap:20 }}>
                    {/* Score breakdown */}
                    <div>
                      <div style={{ fontSize:13, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:14 }}>Phân tích điểm thành phần</div>
                      <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:12 }}>
                        <ScoreCard label="Quá trình"       value={ev.ProcessScore} />
                        <ScoreCard label="Báo cáo tuần"    value={ev.WeeklyReportScore} />
                        <ScoreCard label="Báo cáo cuối kỳ" value={ev.FinalReportScore} />
                        <ScoreCard label="Thái độ"          value={ev.AttitudeScore} />
                      </div>
                    </div>

                    {/* Classification result */}
                    {cls && (
                      <div style={{ background:cls.bg, borderRadius:12, padding:"16px 20px", display:"flex", alignItems:"center", gap:16 }}>
                        <div style={{ width:48, height:48, borderRadius:"50%", background:cls.accent, color:"white", fontSize:22, fontWeight:800, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                          {ev.TotalScore >= 9 ? "🌟" : ev.TotalScore >= 8 ? "⭐" : ev.TotalScore >= 6.5 ? "👍" : "📌"}
                        </div>
                        <div>
                          <div style={{ fontSize:16, fontWeight:700, color:cls.color }}>Xếp loại: {cls.label}</div>
                          <div style={{ fontSize:13, color:cls.color, opacity:0.8, marginTop:2 }}>
                            {ev.TotalScore >= 9   ? "Xuất sắc — Hoàn thành thực tập với kết quả vượt trội."
                            : ev.TotalScore >= 8  ? "Giỏi — Hoàn thành thực tập với kết quả tốt."
                            : ev.TotalScore >= 6.5? "Khá — Hoàn thành thực tập ở mức khá."
                            : "Trung bình — Hoàn thành thực tập ở mức trung bình."}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Comment */}
                    {ev.Comment && (
                      <div>
                        <div style={{ fontSize:13, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:10 }}>Nhận xét của giảng viên</div>
                        <div style={{ background:"#f8fafc", borderRadius:12, padding:"16px 20px", fontSize:14, lineHeight:1.7, color:"var(--text-primary)", borderLeft:"4px solid var(--primary)", whiteSpace:"pre-wrap" }}>
                          {ev.Comment}
                        </div>
                      </div>
                    )}

                    {/* Footer */}
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingTop:8, borderTop:"1px solid var(--border)", fontSize:12, color:"var(--text-muted)" }}>
                      <span>Giảng viên: <strong style={{ color:"var(--text-primary)" }}>{ev.LecturerName}</strong></span>
                      <span>Ngày đánh giá: <strong style={{ color:"var(--text-primary)" }}>{fmt(ev.EvaluatedAt)}</strong></span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};

export default StudentEvaluationResults;
