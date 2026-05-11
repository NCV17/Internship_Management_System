import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { lecturerDashboardAPI } from "../services/api";
import { useToast } from "../context/ToastContext";

const BACKEND = "http://localhost:5000";
const fmt = (d) => d ? new Date(d).toLocaleDateString("vi-VN") : "—";
const fmtDT = (d) => d ? new Date(d).toLocaleString("vi-VN", { day:"2-digit", month:"2-digit", hour:"2-digit", minute:"2-digit" }) : "—";
const ini = (n="") => n.split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2)||"SV";
const card = { background:"var(--bg-card)", borderRadius:"var(--radius-lg)", border:"1px solid var(--border)", boxShadow:"var(--shadow-sm)", overflow:"hidden" };
const RPT = {
  PENDING:           { label:"Chờ duyệt",      bg:"#fef3c7", color:"#92400e" },
  APPROVED:          { label:"Đã duyệt",        bg:"#dcfce7", color:"#166534" },
  REVISION_REQUIRED: { label:"Cần chỉnh sửa",  bg:"#ffedd5", color:"#9a3412" },
  REJECTED:          { label:"Từ chối",         bg:"#fee2e2", color:"#991b1b" },
};

const Badge = ({ status }) => {
  const c = RPT[status] || { label: status, bg:"#f1f5f9", color:"#64748b" };
  return <span style={{ background:c.bg, color:c.color, fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:20 }}>{c.label}</span>;
};

export default function LecturerStudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [data, setData]             = useState(null);
  const [loading, setLoading]       = useState(true);
  const [reviewReport, setReview]   = useState(null);   // report being reviewed
  const [evalOpen, setEvalOpen]     = useState(false);
  const [saving, setSaving]         = useState(false);

  // Review form state
  const [rvStatus, setRvStatus]     = useState("APPROVED");
  const [rvScore, setRvScore]       = useState("");
  const [rvComment, setRvComment]   = useState("");

  // Eval form state
  const [ev, setEv] = useState({ processScore:"", weeklyReportScore:"", finalReportScore:"", attitudeScore:"", totalScore:"", comment:"" });

  const load = async () => {
    try {
      setLoading(true);
      const r = await lecturerDashboardAPI.getStudentDetail(id);
      const d = r.data.data;
      setData(d);
      if (d.evaluation) {
        setEv({
          processScore: d.evaluation.ProcessScore ?? "",
          weeklyReportScore: d.evaluation.WeeklyReportScore ?? "",
          finalReportScore: d.evaluation.FinalReportScore ?? "",
          attitudeScore: d.evaluation.AttitudeScore ?? "",
          totalScore: d.evaluation.TotalScore ?? "",
          comment: d.evaluation.Comment ?? "",
        });
      }
    } catch { toast.error("Không thể tải thông tin sinh viên."); navigate("/lecturer/students"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  const openReview = (r) => {
    setReview(r);
    setRvStatus(r.Status === "APPROVED" ? "APPROVED" : "PENDING");
    setRvScore(r.Score ?? "");
    setRvComment(r.LecturerComment ?? "");
  };

  const submitReview = async () => {
    try {
      setSaving(true);
      await lecturerDashboardAPI.reviewWeeklyReport(id, reviewReport.ReportId, {
        status: rvStatus, score: rvScore !== "" ? parseFloat(rvScore) : null, lecturerComment: rvComment,
      });
      toast.success("Đã lưu nhận xét báo cáo!");
      setReview(null);
      load();
    } catch { toast.error("Lỗi khi lưu nhận xét."); }
    finally { setSaving(false); }
  };

  const submitEval = async () => {
    try {
      setSaving(true);
      await lecturerDashboardAPI.evaluateStudent(id, { periodId: data.period?.PeriodId, ...ev });
      toast.success("Đã lưu đánh giá tổng kết!");
      setEvalOpen(false);
      load();
    } catch { toast.error("Lỗi khi lưu đánh giá."); }
    finally { setSaving(false); }
  };

  if (loading) return <div style={{ display:"flex", justifyContent:"center", padding:60 }}><div className="spinner"/></div>;
  if (!data) return null;

  const { student, registration, period, progress, weeklyReports=[], evaluation } = data;
  const statusCfg = { NOT_STARTED:{label:"Chưa bắt đầu",bg:"#f1f5f9",color:"#64748b"}, IN_PROGRESS:{label:"Đang thực tập",bg:"#e0f2fe",color:"#0284c7"}, COMPLETED:{label:"Hoàn thành",bg:"#dcfce7",color:"#166534"} };
  const sc = statusCfg[student?.Status] || statusCfg.NOT_STARTED;

  return (
    <>
      {/* TOPBAR */}
      <div className="topbar">
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          <button onClick={() => navigate("/lecturer/students")} style={{ background:"none", border:"1px solid var(--border)", borderRadius:"var(--radius-sm)", padding:"7px 10px", cursor:"pointer", color:"var(--text-secondary)" }}>←</button>
          <div>
            <div className="topbar-title">Chi tiết Sinh viên</div>
            <div className="topbar-subtitle">{student?.FullName} · {student?.StudentCode}</div>
          </div>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={() => window.print()} className="btn-primary" style={{ width:"auto", background:"white", color:"var(--text-primary)", border:"1px solid var(--border)", boxShadow:"none" }}>Xuất PDF</button>
          <button onClick={() => setEvalOpen(true)} className="btn-primary" style={{ width:"auto" }}>Đánh giá</button>
        </div>
      </div>

      <div className="page-content">
        <div style={{ display:"grid", gridTemplateColumns:"300px 1fr", gap:20 }}>

          {/* LEFT COLUMN */}
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

            {/* Profile */}
            <div style={card}>
              <div style={{ padding:"24px 20px", textAlign:"center", borderBottom:"1px solid var(--border)", background:"linear-gradient(180deg,#f8fafc 0%,white 100%)" }}>
                <div style={{ width:72, height:72, borderRadius:"50%", background:"linear-gradient(135deg,var(--primary-light),var(--primary))", color:"white", fontSize:24, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 12px" }}>{ini(student?.FullName)}</div>
                <div style={{ fontSize:18, fontWeight:700, marginBottom:4 }}>{student?.FullName}</div>
                <div style={{ fontSize:13, color:"var(--text-muted)", marginBottom:12 }}>MSSV: {student?.StudentCode} · Lớp: {student?.ClassName}</div>
                <div style={{ display:"flex", gap:8, justifyContent:"center", flexWrap:"wrap" }}>
                  <span style={{ background:sc.bg, color:sc.color, fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:20 }}>{sc.label}</span>
                  {student?.GPA && <span style={{ background:"#f3f4f6", color:"#4b5563", fontSize:11, fontWeight:600, padding:"3px 10px", borderRadius:20 }}>GPA: {student.GPA}</span>}
                </div>
              </div>
              <div style={{ padding:"16px 20px", display:"flex", flexDirection:"column", gap:10, fontSize:13 }}>
                <div><span style={{ color:"var(--text-muted)" }}>Email: </span><span style={{ fontWeight:500 }}>{student?.Email}</span></div>
                <div><span style={{ color:"var(--text-muted)" }}>SĐT: </span><span style={{ fontWeight:500 }}>{student?.Phone||"Chưa cập nhật"}</span></div>
              </div>
            </div>

            {/* Company */}
            <div style={card}>
              <div style={{ padding:"14px 20px", borderBottom:"1px solid var(--border)", background:"#f8fafc", fontWeight:700, fontSize:14 }}>Đơn vị thực tập</div>
              <div style={{ padding:"16px 20px", fontSize:13 }}>
                {registration ? (
                  <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    <div style={{ fontSize:15, fontWeight:700, color:"var(--primary-dark)" }}>{registration.CompanyName}</div>
                    <div style={{ color:"var(--text-muted)" }}>{registration.Field}</div>
                    <div style={{ height:1, background:"var(--border)", margin:"4px 0" }}/>
                    {[["Địa chỉ",registration.Address],["Liên hệ",registration.ContactPerson],["Email",registration.ContactEmail],["Đợt",period?.PeriodName]].map(([l,v])=>(
                      <div key={l} style={{ display:"grid", gridTemplateColumns:"72px 1fr", gap:6 }}>
                        <span style={{ color:"var(--text-muted)" }}>{l}:</span>
                        <span style={{ fontWeight:500, color:"var(--text-primary)" }}>{v||"—"}</span>
                      </div>
                    ))}
                  </div>
                ) : <div style={{ color:"var(--text-muted)", textAlign:"center", padding:"12px 0" }}>Chưa đăng ký đơn vị.</div>}
              </div>
            </div>

            {/* Evaluation result */}
            {evaluation && (
              <div style={card}>
                <div style={{ padding:"14px 20px", borderBottom:"1px solid var(--border)", background:"#f8fafc", fontWeight:700, fontSize:14 }}>Kết quả đánh giá</div>
                <div style={{ padding:"16px 20px" }}>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:12 }}>
                    {[["Quá trình",evaluation.ProcessScore],["BC tuần",evaluation.WeeklyReportScore],["BC cuối kỳ",evaluation.FinalReportScore],["Thái độ",evaluation.AttitudeScore]].map(([l,v])=>(
                      <div key={l} style={{ background:"#f8fafc", borderRadius:8, padding:"10px 12px", textAlign:"center" }}>
                        <div style={{ fontSize:20, fontWeight:800, color:"var(--primary)" }}>{v??"-"}</div>
                        <div style={{ fontSize:11, color:"var(--text-muted)" }}>{l}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ background:"#eff6ff", borderRadius:10, padding:"12px 16px", textAlign:"center" }}>
                    <div style={{ fontSize:28, fontWeight:800, color:"var(--primary)" }}>{evaluation.TotalScore??"-"}</div>
                    <div style={{ fontSize:12, color:"var(--text-muted)" }}>Điểm tổng kết</div>
                  </div>
                  {evaluation.Comment && <div style={{ marginTop:10, fontSize:13, color:"var(--text-secondary)", background:"#f8fafc", padding:"10px 12px", borderRadius:8 }}>{evaluation.Comment}</div>}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN */}
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

            {/* Progress */}
            <div style={{ ...card, padding:20 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                <div style={{ fontSize:15, fontWeight:700 }}>Tiến độ thực tập</div>
                <span style={{ fontSize:22, fontWeight:800, color:"var(--primary)" }}>{progress?.ProgressPercent||0}%</span>
              </div>
              <div style={{ height:10, background:"#f1f5f9", borderRadius:5, overflow:"hidden", marginBottom:10 }}>
                <div style={{ height:"100%", width:`${progress?.ProgressPercent||0}%`, background:"linear-gradient(90deg,var(--primary-light),var(--primary))", borderRadius:5, transition:"width 1s" }}/>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:"var(--text-muted)" }}>
                <span>Bắt đầu: {fmt(period?.StartDate)}</span>
                <span>Kết thúc: {fmt(period?.EndDate)}</span>
              </div>
            </div>

            {/* Report history */}
            <div style={card}>
              <div style={{ padding:"16px 24px", borderBottom:"1px solid var(--border)", display:"flex", justifyContent:"space-between", alignItems:"center", background:"#f8fafc" }}>
                <div style={{ fontSize:15, fontWeight:700 }}>Lịch sử báo cáo</div>
                <span style={{ background:"#eff6ff", color:"var(--primary)", fontSize:12, fontWeight:600, padding:"3px 12px", borderRadius:20 }}>{weeklyReports.length} báo cáo</span>
              </div>
              {weeklyReports.length === 0 ? (
                <div style={{ padding:40, textAlign:"center", color:"var(--text-muted)", fontSize:14 }}>Chưa có báo cáo nào được nộp.</div>
              ) : (
                <div>
                  {weeklyReports.map((r, idx) => (
                    <div key={r.ReportId}
                      onClick={() => openReview(r)}
                      style={{ padding:"16px 24px", borderBottom: idx < weeklyReports.length-1 ? "1px solid var(--border)" : "none", display:"grid", gridTemplateColumns:"1fr auto", gap:16, cursor:"pointer", transition:"background 0.15s" }}
                      onMouseEnter={e => e.currentTarget.style.background="#f8fafc"}
                      onMouseLeave={e => e.currentTarget.style.background="transparent"}
                    >
                      <div>
                        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6, flexWrap:"wrap" }}>
                          <span style={{ fontWeight:600, fontSize:14, color:"var(--text-primary)" }}>{r.Title}</span>
                          <Badge status={r.Status}/>
                          {r.ReportType && <span style={{ background:"#eff6ff", color:"var(--primary)", fontSize:11, padding:"2px 8px", borderRadius:6 }}>{r.ReportType==="WEEKLY"?"BC Tuần":"BC Cuối kỳ"}</span>}
                          {r.Score != null && <span style={{ background:"#f3f4f6", color:"#374151", fontSize:11, fontWeight:600, padding:"2px 8px", borderRadius:6 }}>Điểm: {r.Score}</span>}
                          {r.FilePath && <span style={{ fontSize:14 }} title="Có tệp đính kèm">📎</span>}
                        </div>
                        <div style={{ fontSize:12, color:"var(--text-muted)", display:"flex", gap:16, flexWrap:"wrap" }}>
                          <span>Nộp: {fmtDT(r.SubmittedAt)}</span>
                          {r.WeekNumber && <span>Tuần {r.WeekNumber}</span>}
                          {r.DueDate && <span>Hạn: {fmt(r.DueDate)}</span>}
                        </div>
                        {r.LecturerComment && <div style={{ marginTop:6, fontSize:12, color:"#6b7280", background:"#f9fafb", padding:"6px 10px", borderRadius:6, borderLeft:"3px solid #e5e7eb" }}>{r.LecturerComment.slice(0,100)}{r.LecturerComment.length>100?"…":""}</div>}
                      </div>
                      <div style={{ display:"flex", alignItems:"center" }}>
                        <span style={{ fontSize:12, color:"var(--primary)", fontWeight:600 }}>Xem xét →</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* REVIEW DRAWER */}
      {reviewReport && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.4)", zIndex:1000, display:"flex", justifyContent:"flex-end" }} onClick={() => setReview(null)}>
          <div style={{ width:"100%", maxWidth:560, background:"white", height:"100%", overflowY:"auto", boxShadow:"-4px 0 24px rgba(0,0,0,0.12)", display:"flex", flexDirection:"column" }} onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div style={{ padding:"20px 24px", borderBottom:"1px solid var(--border)", background:"#f8fafc", display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <div>
                <div style={{ fontSize:17, fontWeight:700, marginBottom:4 }}>{reviewReport.Title}</div>
                <Badge status={reviewReport.Status}/>
              </div>
              <button onClick={() => setReview(null)} style={{ background:"none", border:"none", cursor:"pointer", fontSize:20, color:"var(--text-muted)" }}>✕</button>
            </div>

            <div style={{ flex:1, padding:24, display:"flex", flexDirection:"column", gap:20, overflowY:"auto" }}>
              {/* Submission info */}
              <div>
                <div style={{ fontSize:12, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", marginBottom:8 }}>Thông tin nộp bài</div>
                <div style={{ background:"#f8fafc", borderRadius:10, padding:"14px 16px", fontSize:13, display:"flex", flexDirection:"column", gap:6 }}>
                  <div><span style={{ color:"var(--text-muted)" }}>Thời gian nộp: </span><strong>{fmtDT(reviewReport.SubmittedAt)}</strong></div>
                  {reviewReport.WeekNumber && <div><span style={{ color:"var(--text-muted)" }}>Tuần: </span><strong>{reviewReport.WeekNumber}</strong></div>}
                  {reviewReport.DueDate && <div><span style={{ color:"var(--text-muted)" }}>Hạn nộp: </span><strong>{fmt(reviewReport.DueDate)}</strong></div>}
                </div>
              </div>

              {/* Content */}
              {reviewReport.Content && (
                <div>
                  <div style={{ fontSize:12, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", marginBottom:8 }}>Nội dung báo cáo</div>
                  <div style={{ background:"#f8fafc", borderRadius:10, padding:"14px 16px", fontSize:14, lineHeight:1.6, whiteSpace:"pre-wrap", minHeight:60 }}>{reviewReport.Content}</div>
                </div>
              )}

              {/* Attachment */}
              {reviewReport.FilePath && (
                <div>
                  <div style={{ fontSize:12, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", marginBottom:8 }}>Tệp đính kèm</div>
                  <div style={{ background:"#eff6ff", borderRadius:10, padding:"14px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", border:"1px solid #bfdbfe" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <span style={{ fontSize:24 }}>📄</span>
                      <div>
                        <div style={{ fontSize:14, fontWeight:600 }}>{reviewReport.FileName||"Tệp báo cáo"}</div>
                        {reviewReport.FileSize && <div style={{ fontSize:12, color:"var(--text-muted)" }}>{(reviewReport.FileSize/1048576).toFixed(2)} MB</div>}
                      </div>
                    </div>
                    <div style={{ display:"flex", gap:8 }}>
                      <a href={`${BACKEND}${reviewReport.FilePath}`} target="_blank" rel="noreferrer" style={{ background:"white", color:"var(--primary)", padding:"6px 14px", borderRadius:20, fontSize:13, fontWeight:600, textDecoration:"none", border:"1px solid #bfdbfe" }}>Xem</a>
                      <a href={`${BACKEND}${reviewReport.FilePath}`} download style={{ background:"var(--primary)", color:"white", padding:"6px 14px", borderRadius:20, fontSize:13, fontWeight:600, textDecoration:"none" }}>Tải</a>
                    </div>
                  </div>
                </div>
              )}

              {/* Review form */}
              <div style={{ background:"#f8fafc", borderRadius:12, padding:20, border:"1px solid var(--border)", display:"flex", flexDirection:"column", gap:14 }}>
                <div style={{ fontSize:13, fontWeight:700, color:"var(--text-primary)" }}>Nhận xét & Chấm điểm</div>

                <div>
                  <div style={{ fontSize:12, fontWeight:600, color:"var(--text-muted)", marginBottom:6 }}>Trạng thái</div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:8 }}>
                    {Object.entries(RPT).map(([k,v]) => (
                      <button key={k} onClick={() => setRvStatus(k)}
                        style={{ padding:"8px 6px", borderRadius:8, fontSize:11, fontWeight:700, border:`2px solid ${rvStatus===k?v.color:"var(--border)"}`, background:rvStatus===k?v.bg:"white", color:rvStatus===k?v.color:"var(--text-muted)", cursor:"pointer" }}>
                        {v.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize:12, fontWeight:600, color:"var(--text-muted)", marginBottom:6 }}>Điểm (0 – 10)</div>
                  <input type="number" min={0} max={10} step={0.5} value={rvScore} onChange={e=>setRvScore(e.target.value)}
                    style={{ width:"100%", padding:"9px 12px", border:"1px solid var(--border)", borderRadius:8, fontSize:14, outline:"none", boxSizing:"border-box" }} placeholder="Nhập điểm..."/>
                </div>

                <div>
                  <div style={{ fontSize:12, fontWeight:600, color:"var(--text-muted)", marginBottom:6 }}>Nhận xét</div>
                  <textarea rows={4} value={rvComment} onChange={e=>setRvComment(e.target.value)}
                    style={{ width:"100%", padding:"9px 12px", border:"1px solid var(--border)", borderRadius:8, fontSize:13, resize:"vertical", outline:"none", fontFamily:"inherit", boxSizing:"border-box" }} placeholder="Nhập nhận xét cho sinh viên..."/>
                </div>
              </div>
            </div>

            <div style={{ padding:"16px 24px", borderTop:"1px solid var(--border)", display:"flex", gap:10 }}>
              <button onClick={() => setReview(null)} className="btn-primary" style={{ flex:1, background:"var(--bg-page)", color:"var(--text-primary)", border:"1px solid var(--border)", boxShadow:"none" }}>Hủy</button>
              <button onClick={submitReview} disabled={saving} className="btn-primary" style={{ flex:2 }}>{saving?"Đang lưu…":"Lưu nhận xét"}</button>
            </div>
          </div>
        </div>
      )}

      {/* EVALUATION MODAL */}
      {evalOpen && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center" }} onClick={() => setEvalOpen(false)}>
          <div style={{ background:"white", width:"100%", maxWidth:520, borderRadius:"var(--radius-lg)", boxShadow:"0 20px 60px rgba(0,0,0,0.2)", overflow:"hidden" }} onClick={e=>e.stopPropagation()}>
            <div style={{ padding:"20px 24px", borderBottom:"1px solid var(--border)", background:"#f8fafc", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <div style={{ fontSize:17, fontWeight:700 }}>Đánh giá tổng kết</div>
                <div style={{ fontSize:13, color:"var(--text-muted)", marginTop:2 }}>{student?.FullName} — {period?.PeriodName}</div>
              </div>
              <button onClick={()=>setEvalOpen(false)} style={{ background:"none", border:"none", cursor:"pointer", fontSize:20, color:"var(--text-muted)" }}>✕</button>
            </div>
            <div style={{ padding:24, display:"flex", flexDirection:"column", gap:16 }}>
              <div style={{ background:"#eff6ff", borderRadius:10, padding:"10px 14px", fontSize:13, color:"var(--primary)" }}>
                Đây là đánh giá cuối kỳ thực tập, khác với chấm điểm báo cáo tuần.
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                {[["processScore","Quá trình"],["weeklyReportScore","BC tuần"],["finalReportScore","BC cuối kỳ"],["attitudeScore","Thái độ"],["totalScore","Điểm tổng kết"]].map(([k,l])=>(
                  <div key={k}>
                    <div style={{ fontSize:12, fontWeight:600, color:"var(--text-muted)", marginBottom:5 }}>{l} (0–10)</div>
                    <input type="number" min={0} max={10} step={0.5} value={ev[k]} onChange={e=>setEv(p=>({...p,[k]:e.target.value}))}
                      style={{ width:"100%", padding:"9px 12px", border:"1px solid var(--border)", borderRadius:8, fontSize:14, outline:"none", boxSizing:"border-box" }} placeholder="—"/>
                  </div>
                ))}
              </div>
              <div>
                <div style={{ fontSize:12, fontWeight:600, color:"var(--text-muted)", marginBottom:5 }}>Nhận xét chung</div>
                <textarea rows={4} value={ev.comment} onChange={e=>setEv(p=>({...p,comment:e.target.value}))}
                  style={{ width:"100%", padding:"9px 12px", border:"1px solid var(--border)", borderRadius:8, fontSize:13, resize:"vertical", outline:"none", fontFamily:"inherit", boxSizing:"border-box" }} placeholder="Nhận xét tổng quan về sinh viên..."/>
              </div>
            </div>
            <div style={{ padding:"16px 24px", borderTop:"1px solid var(--border)", display:"flex", gap:10 }}>
              <button onClick={()=>setEvalOpen(false)} className="btn-primary" style={{ flex:1, background:"var(--bg-page)", color:"var(--text-primary)", border:"1px solid var(--border)", boxShadow:"none" }}>Hủy</button>
              <button onClick={submitEval} disabled={saving} className="btn-primary" style={{ flex:2 }}>{saving?"Đang lưu…":"Lưu đánh giá"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
