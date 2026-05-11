import { useState, useEffect } from "react";
import { lecturerDashboardAPI } from "../services/api";
import { useToast } from "../context/ToastContext";

const ini = (n="") => n.split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2)||"SV";
const fmt = (d) => d ? new Date(d).toLocaleDateString("vi-VN") : "—";

const classify = (score) => {
  if (score == null) return null;
  if (score >= 9)   return { label:"Xuất sắc", bg:"#dcfce7", color:"#166534" };
  if (score >= 8)   return { label:"Giỏi",     bg:"#dbeafe", color:"#1d4ed8" };
  if (score >= 6.5) return { label:"Khá",      bg:"#fef9c3", color:"#713f12" };
  return                   { label:"Trung bình", bg:"#fee2e2", color:"#991b1b" };
};

const ScoreInput = ({ label, value, onChange, disabled }) => (
  <div>
    <div style={{ fontSize:12, fontWeight:600, color:"var(--text-muted)", marginBottom:5 }}>{label}</div>
    <input type="number" min={0} max={10} step={0.5} value={value} onChange={onChange} disabled={disabled}
      style={{ width:"100%", padding:"9px 12px", border:"1px solid var(--border)", borderRadius:8, fontSize:14, outline:"none", boxSizing:"border-box", background: disabled?"#f8fafc":"white" }}
      placeholder="0–10" />
  </div>
);

const EvalModal = ({ student, periodId, onClose, onSaved }) => {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    processScore:      student.ProcessScore      ?? "",
    weeklyReportScore: student.WeeklyReportScore ?? "",
    finalReportScore:  student.FinalReportScore  ?? "",
    attitudeScore:     student.AttitudeScore     ?? "",
    totalScore:        student.TotalScore        ?? "",
    comment:           student.Comment           ?? "",
  });

  const set = (k) => (e) => {
    const v = e.target.value;
    setForm(p => {
      const next = { ...p, [k]: v };
      // Auto-calc total when any component changes
      const ps = parseFloat(next.processScore)||0;
      const ws = parseFloat(next.weeklyReportScore)||0;
      const fs = parseFloat(next.finalReportScore)||0;
      const as = parseFloat(next.attitudeScore)||0;
      if (k !== "totalScore") {
        const avg = ((ps+ws+fs+as)/4).toFixed(2);
        next.totalScore = avg;
      }
      return next;
    });
  };

  const validate = () => {
    const keys = ["processScore","weeklyReportScore","finalReportScore","attitudeScore","totalScore"];
    for (const k of keys) {
      const v = parseFloat(form[k]);
      if (isNaN(v) || v < 0 || v > 10) return `${k}: điểm phải từ 0 đến 10`;
    }
    return null;
  };

  const submit = async () => {
    const err = validate();
    if (err) { toast.error(err); return; }
    try {
      setSaving(true);
      await lecturerDashboardAPI.evaluateStudent(student.StudentId, {
        periodId,
        processScore:      parseFloat(form.processScore),
        weeklyReportScore: parseFloat(form.weeklyReportScore),
        finalReportScore:  parseFloat(form.finalReportScore),
        attitudeScore:     parseFloat(form.attitudeScore),
        totalScore:        parseFloat(form.totalScore),
        comment:           form.comment,
      });
      toast.success("Đã lưu đánh giá!");
      onSaved();
    } catch { toast.error("Lỗi khi lưu đánh giá."); }
    finally { setSaving(false); }
  };

  const cls = classify(parseFloat(form.totalScore));

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center" }} onClick={onClose}>
      <div style={{ background:"white", width:"100%", maxWidth:540, borderRadius:16, boxShadow:"0 20px 60px rgba(0,0,0,0.2)", overflow:"hidden" }} onClick={e=>e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding:"20px 24px", borderBottom:"1px solid var(--border)", background:"#f8fafc", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={{ fontSize:17, fontWeight:700 }}>Đánh giá tổng kết thực tập</div>
            <div style={{ fontSize:13, color:"var(--text-muted)", marginTop:3 }}>{student.FullName} · {student.StudentCode}</div>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", fontSize:22, color:"var(--text-muted)", lineHeight:1 }}>×</button>
        </div>

        <div style={{ padding:24, display:"flex", flexDirection:"column", gap:16 }}>
          {/* Info banner */}
          <div style={{ background:"#eff6ff", borderRadius:10, padding:"10px 14px", fontSize:13, color:"#1d4ed8", borderLeft:"3px solid #3b82f6" }}>
            Đây là đánh giá kết quả thực tập cuối kỳ, khác với chấm điểm báo cáo tuần.
          </div>

          {/* Score grid */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <ScoreInput label="Điểm quá trình" value={form.processScore} onChange={set("processScore")} />
            <ScoreInput label="Điểm báo cáo tuần" value={form.weeklyReportScore} onChange={set("weeklyReportScore")} />
            <ScoreInput label="Điểm báo cáo cuối kỳ" value={form.finalReportScore} onChange={set("finalReportScore")} />
            <ScoreInput label="Điểm thái độ" value={form.attitudeScore} onChange={set("attitudeScore")} />
          </div>

          {/* Total score */}
          <div style={{ background:"#f8fafc", borderRadius:12, padding:"14px 16px", display:"flex", alignItems:"center", gap:16 }}>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:12, fontWeight:600, color:"var(--text-muted)", marginBottom:5 }}>Điểm tổng kết (tự động · có thể chỉnh)</div>
              <input type="number" min={0} max={10} step={0.1} value={form.totalScore} onChange={set("totalScore")}
                style={{ width:"100%", padding:"9px 12px", border:"2px solid var(--primary)", borderRadius:8, fontSize:16, fontWeight:700, outline:"none", boxSizing:"border-box", color:"var(--primary)" }}
                placeholder="0–10" />
            </div>
            {cls && (
              <div style={{ textAlign:"center" }}>
                <div style={{ background:cls.bg, color:cls.color, fontSize:13, fontWeight:700, padding:"6px 14px", borderRadius:20 }}>{cls.label}</div>
              </div>
            )}
          </div>

          {/* Comment */}
          <div>
            <div style={{ fontSize:12, fontWeight:600, color:"var(--text-muted)", marginBottom:5 }}>Nhận xét tổng quan</div>
            <textarea rows={4} value={form.comment} onChange={e=>setForm(p=>({...p,comment:e.target.value}))}
              style={{ width:"100%", padding:"9px 12px", border:"1px solid var(--border)", borderRadius:8, fontSize:13, resize:"vertical", outline:"none", fontFamily:"inherit", boxSizing:"border-box" }}
              placeholder="Nhận xét về quá trình thực tập của sinh viên..." />
          </div>
        </div>

        <div style={{ padding:"16px 24px", borderTop:"1px solid var(--border)", display:"flex", gap:10 }}>
          <button onClick={onClose} className="btn-primary" style={{ flex:1, background:"var(--bg-page)", color:"var(--text-primary)", border:"1px solid var(--border)", boxShadow:"none" }}>Hủy</button>
          <button onClick={submit} disabled={saving} className="btn-primary" style={{ flex:2 }}>{saving?"Đang lưu…":"Lưu đánh giá"}</button>
        </div>
      </div>
    </div>
  );
};

const LecturerEvaluations = () => {
  const toast = useToast();
  const [students, setStudents]   = useState([]);
  const [periods, setPeriods]     = useState([]);
  const [periodId, setPeriodId]   = useState("");
  const [loading, setLoading]     = useState(true);
  const [modal, setModal]         = useState(null); // student being evaluated

  // Load filter periods
  useEffect(() => {
    lecturerDashboardAPI.getFilterOptions().then(res => {
      const p = res.data.data?.periods || [];
      setPeriods(p);
      const active = p.find(x => x.Status === "ACTIVE") || p[0];
      if (active) setPeriodId(String(active.PeriodId));
    }).catch(() => {});
  }, []);

  useEffect(() => { if (periodId) load(); }, [periodId]);

  const load = async () => {
    try {
      setLoading(true);
      const res = await lecturerDashboardAPI.getEvaluationStudents({ periodId });
      setStudents(res.data.data || []);
    } catch { toast.error("Không thể tải danh sách sinh viên."); }
    finally { setLoading(false); }
  };

  const evaluated = students.filter(s => s.EvaluationId != null).length;
  const notYet    = students.length - evaluated;

  return (
    <>
      <div className="topbar">
        <div>
          <div className="topbar-title">Đánh giá sinh viên</div>
          <div className="topbar-subtitle">Đánh giá kết quả thực tập cuối kỳ cho sinh viên được phân công.</div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <select value={periodId} onChange={e=>setPeriodId(e.target.value)}
            style={{ padding:"9px 14px", border:"1px solid var(--border)", borderRadius:8, fontSize:13, outline:"none", background:"white", minWidth:200 }}>
            <option value="">Tất cả đợt</option>
            {periods.map(p => <option key={p.PeriodId} value={String(p.PeriodId)}>{p.PeriodName}</option>)}
          </select>
        </div>
      </div>

      <div className="page-content">
        {/* Stats */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16, marginBottom:20 }}>
          {[
            { label:"Tổng sinh viên",  val:students.length, bg:"#eff6ff", color:"#1d4ed8" },
            { label:"Đã đánh giá",     val:evaluated,       bg:"#dcfce7", color:"#166534" },
            { label:"Chưa đánh giá",   val:notYet,          bg:"#fef3c7", color:"#92400e" },
          ].map(({label,val,bg,color}) => (
            <div key={label} style={{ background:"var(--bg-card)", borderRadius:14, border:"1px solid var(--border)", boxShadow:"var(--shadow-sm)", padding:"18px 22px", display:"flex", alignItems:"center", gap:14 }}>
              <div style={{ width:50, height:50, borderRadius:12, background:bg, color, fontSize:22, fontWeight:800, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{val}</div>
              <div style={{ fontSize:13, fontWeight:500, color:"var(--text-secondary)" }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Student cards */}
        {loading ? (
          <div style={{ display:"flex", justifyContent:"center", padding:60 }}><div className="spinner"/></div>
        ) : students.length === 0 ? (
          <div style={{ background:"var(--bg-card)", borderRadius:14, border:"1px dashed var(--border)", padding:60, textAlign:"center" }}>
            <div style={{ fontSize:40, marginBottom:12 }}>📋</div>
            <h3 style={{ fontSize:17, fontWeight:600, marginBottom:8 }}>Không có sinh viên</h3>
            <p style={{ color:"var(--text-muted)", fontSize:14 }}>Chọn đợt thực tập để xem danh sách sinh viên được phân công.</p>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {students.map(s => {
              const hasEval = s.EvaluationId != null;
              const cls = hasEval ? classify(s.TotalScore) : null;
              return (
                <div key={s.StudentId} style={{ background:"var(--bg-card)", borderRadius:14, border:"1px solid var(--border)", boxShadow:"var(--shadow-sm)", padding:"18px 24px", display:"grid", gridTemplateColumns:"220px 1fr auto", gap:20, alignItems:"center" }}>
                  {/* Identity */}
                  <div style={{ display:"flex", gap:12, alignItems:"center" }}>
                    <div style={{ width:46, height:46, borderRadius:"50%", background:`linear-gradient(135deg,${hasEval?"#22c55e,#16a34a":"var(--primary-light),var(--primary)"})`, color:"white", fontSize:16, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      {ini(s.FullName)}
                    </div>
                    <div>
                      <div style={{ fontSize:14.5, fontWeight:700, color:"var(--text-primary)", marginBottom:2 }}>{s.FullName}</div>
                      <div style={{ fontSize:12, color:"var(--text-muted)" }}>{s.StudentCode} · {s.ClassName}</div>
                    </div>
                  </div>

                  {/* Info */}
                  <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                    <div style={{ fontSize:13.5, fontWeight:500, color:"var(--text-primary)" }}>
                      {s.CompanyName || <span style={{ fontStyle:"italic", color:"var(--text-muted)" }}>Chưa có đơn vị</span>}
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
                      <span style={{ fontSize:12, color:"var(--text-muted)" }}>{s.submittedReports} báo cáo đã nộp</span>
                      {hasEval ? (
                        <>
                          <span style={{ background:"#dcfce7", color:"#166534", fontSize:11, fontWeight:700, padding:"2px 9px", borderRadius:20 }}>Đã đánh giá</span>
                          {cls && <span style={{ background:cls.bg, color:cls.color, fontSize:11, fontWeight:700, padding:"2px 9px", borderRadius:20 }}>{cls.label}</span>}
                          <span style={{ background:"#f3f4f6", color:"#374151", fontSize:11, fontWeight:700, padding:"2px 9px", borderRadius:20 }}>Tổng: {s.TotalScore ?? "—"}/10</span>
                        </>
                      ) : (
                        <span style={{ background:"#fef3c7", color:"#92400e", fontSize:11, fontWeight:700, padding:"2px 9px", borderRadius:20 }}>Chưa đánh giá</span>
                      )}
                      {hasEval && <span style={{ fontSize:11, color:"var(--text-muted)" }}>Đánh giá: {fmt(s.EvaluatedAt)}</span>}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display:"flex", gap:8, flexShrink:0 }}>
                    <button onClick={() => setModal(s)} className="btn-primary" style={{ padding:"7px 16px", fontSize:13, width:"auto" }}>
                      {hasEval ? "Sửa đánh giá" : "Đánh giá"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {modal && (
        <EvalModal
          student={modal}
          periodId={periodId}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(); }}
        />
      )}
    </>
  );
};

export default LecturerEvaluations;
