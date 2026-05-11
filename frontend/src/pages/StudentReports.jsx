import { useState, useEffect } from "react";
import { useToast } from "../context/ToastContext";
import { studentInternshipAPI } from "../services/api";

const BACKEND_URL = "http://localhost:5000";

const StudentReports = () => {
  const toast = useToast();

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [content, setContent] = useState("");
  const [file, setFile] = useState(null);
  const [existingFileUrl, setExistingFileUrl] = useState(null);
  const [existingFileName, setExistingFileName] = useState(null);
  const [existingFileSize, setExistingFileSize] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => { fetchReports(); }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await studentInternshipAPI.getReports();
      setReports(res.data.data);
    } catch {
      toast.error("Lỗi khi tải danh sách báo cáo");
    } finally {
      setLoading(false);
    }
  };

  const isOverdue = (d) => new Date() > new Date(d);

  const canEdit = (r) => {
    if (r.TemplateStatus === "CLOSED") return false;
    if (r.SubmissionStatus === "APPROVED" || r.SubmissionStatus === "REJECTED") return false;
    if (isOverdue(r.DueDate)) return r.SubmissionStatus === "REVISION_REQUIRED";
    return true; // no submission, PENDING, or REVISION_REQUIRED
  };

  const getStatusBadge = (r) => {
    if (!r.SubmissionStatus) {
      return isOverdue(r.DueDate)
        ? { label: "ĐÃ QUÁ HẠN", bg: "#fee2e2", color: "#ef4444" }
        : { label: "CHƯA NỘP", bg: "#f1f5f9", color: "#64748b" };
    }
    switch (r.SubmissionStatus) {
      case "PENDING": return { label: "CHỜ DUYỆT", bg: "#fef3c7", color: "#eab308" };
      case "APPROVED": return { label: "ĐÃ DUYỆT", bg: "#dcfce7", color: "#16a34a" };
      case "REVISION_REQUIRED": return { label: "CẦN CHỈNH SỬA", bg: "#ffedd5", color: "#f97316" };
      case "REJECTED": return { label: "TỪ CHỐI", bg: "#fee2e2", color: "#ef4444" };
      default: return { label: r.SubmissionStatus, bg: "#f1f5f9", color: "#64748b" };
    }
  };

  const getActionText = (r) => {
    if (!r.SubmissionStatus) return "Nộp báo cáo";
    switch (r.SubmissionStatus) {
      case "PENDING": return "Chỉnh sửa bài nộp";
      case "APPROVED": return "Xem bài đã nộp";
      case "REVISION_REQUIRED": return "Nộp lại báo cáo";
      case "REJECTED": return "Xem chi tiết";
      default: return "Chi tiết";
    }
  };

  const openModal = (r) => {
    setSelectedReport(r);
    setContent(r.Content || "");
    setFile(null);
    setExistingFileUrl(r.FilePath || null);
    setExistingFileName(r.FileName || null);
    setExistingFileSize(r.FileSize || null);
    setIsModalOpen(true);
  };

  const handleRemoveFile = () => {
    setFile(null);
    setExistingFileUrl(null);
    setExistingFileName(null);
    setExistingFileSize(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file && !existingFileUrl) return toast.error("Vui lòng chọn tệp báo cáo");
    try {
      const data = new FormData();
      data.append("TemplateId", selectedReport.TemplateId);
      if (content) data.append("Content", content);
      if (file) data.append("file", file);
      await studentInternshipAPI.submitReport(data);
      toast.success("Nộp báo cáo thành công!");
      setIsModalOpen(false);
      fetchReports();
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi khi nộp báo cáo");
    }
  };

  const fmt = (d) => d ? new Date(d).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "";
  const fmtMB = (bytes) => bytes ? `${(bytes / 1048576).toFixed(2)} MB` : "";

  if (loading) return <div style={{ padding: 40, textAlign: "center" }}>Đang tải dữ liệu...</div>;

  const periodName = reports.length > 0 ? reports[0].PeriodName : "Chưa có kỳ thực tập active";

  return (
    <>
      <div className="topbar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div className="topbar-title">Nộp báo cáo</div>
          <div className="topbar-subtitle">Theo dõi và nộp các báo cáo thực tập - {periodName}</div>
        </div>
      </div>

      <div className="page-content" style={{ padding: 24 }}>
        {reports.length === 0 ? (
          <div style={{ background: "var(--bg-card)", padding: 40, borderRadius: "var(--radius-lg)", textAlign: "center", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)", marginBottom: 8 }}>Không có báo cáo</h3>
            <p>Hiện tại chưa có báo cáo cần nộp.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: 24 }}>
            {reports.map((r) => {
              const badge = getStatusBadge(r);
              const editable = canEdit(r);
              const overdue = isOverdue(r.DueDate);
              return (
                <div key={r.TemplateId}
                  style={{ background: "var(--bg-card)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)", padding: 20, display: "flex", flexDirection: "column", gap: 16, transition: "transform 0.2s, box-shadow 0.2s" }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "var(--shadow-md)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "var(--shadow-sm)"; }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1, paddingRight: 12 }}>
                      <h3 style={{ margin: "0 0 8px 0", fontSize: 16, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.4 }}>{r.Title}</h3>
                      <span style={{ background: "#eff6ff", color: "var(--primary)", padding: "4px 8px", borderRadius: 4, fontSize: 12, fontWeight: 600 }}>
                        {r.ReportType === "WEEKLY" ? "Báo cáo tuần" : "Báo cáo cuối kỳ"}
                      </span>
                    </div>
                    <div style={{ background: badge.bg, color: badge.color, padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>{badge.label}</div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13, color: "var(--text-secondary)" }}>
                    <div>GVHD: <strong style={{ color: "var(--text-primary)" }}>{r.LecturerName}</strong></div>
                    <div>Hạn: <strong style={{ color: overdue && !r.SubmissionStatus ? "#ef4444" : "var(--text-primary)" }}>{fmt(r.DueDate)}</strong></div>
                    {r.SubmissionStatus && (
                      <>
                        {r.FileName && <div style={{ color: "var(--primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>📄 {r.FileName}</div>}
                        <div>Đã nộp: <strong style={{ color: "#16a34a" }}>{fmt(r.SubmittedAt)}</strong></div>
                      </>
                    )}
                  </div>

                  {r.LecturerComment && (
                    <div style={{ background: "#f8fafc", padding: 12, borderRadius: "var(--radius)", borderLeft: "3px solid var(--primary)", fontSize: 13 }}>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>Giảng viên nhận xét:</div>
                      <div style={{ color: "var(--text-secondary)" }}>{r.LecturerComment}</div>
                    </div>
                  )}

                  <div style={{ marginTop: "auto", paddingTop: 16, borderTop: "1px solid var(--border)" }}>
                    <button
                      onClick={() => openModal(r)}
                      className="btn-primary"
                      style={{ width: "100%", padding: 10, background: editable ? "var(--primary)" : "white", color: editable ? "white" : "var(--text-secondary)", border: editable ? "none" : "1px solid var(--border)" }}
                    >
                      {getActionText(r)}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL */}
      {isModalOpen && selectedReport && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
          <div style={{ background: "white", width: "100%", maxWidth: 600, borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-lg)", overflow: "hidden" }}>
            {/* Header */}
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", background: "#f8fafc", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ margin: "0 0 4px 0", fontSize: 18, fontWeight: 700 }}>
                  {selectedReport.SubmissionStatus === "APPROVED" || selectedReport.SubmissionStatus === "REJECTED" ? "Chi tiết bài nộp" : "Nộp báo cáo"}
                </h3>
                <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>{selectedReport.Title}</div>
              </div>
              <button onClick={() => setIsModalOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>✕</button>
            </div>

            <div style={{ padding: 24, maxHeight: "70vh", overflowY: "auto", display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Info box */}
              <div style={{ background: "#f1f5f9", padding: 16, borderRadius: "var(--radius)" }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, textTransform: "uppercase", color: "var(--text-primary)" }}>Yêu cầu báo cáo</div>
                <div style={{ fontSize: 14, color: "var(--text-secondary)", whiteSpace: "pre-wrap" }}>{selectedReport.Description || "Không có mô tả thêm."}</div>
                <div style={{ marginTop: 10, display: "flex", gap: 16, fontSize: 13 }}>
                  <span>Hạn: <strong style={{ color: isOverdue(selectedReport.DueDate) ? "#ef4444" : "var(--text-primary)" }}>{fmt(selectedReport.DueDate)}</strong></span>
                  <span>GVHD: <strong>{selectedReport.LecturerName}</strong></span>
                </div>
              </div>

              {/* Revision feedback */}
              {selectedReport.LecturerComment && (
                <div style={{ background: "#ffedd5", padding: 16, borderRadius: "var(--radius)", borderLeft: "4px solid #f97316" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6, color: "#9a3412", textTransform: "uppercase" }}>Phản hồi từ GVHD</div>
                  <div style={{ fontSize: 14, color: "#9a3412", whiteSpace: "pre-wrap" }}>{selectedReport.LecturerComment}</div>
                </div>
              )}

              {/* LOCKED: APPROVED or REJECTED - readonly view */}
              {(selectedReport.SubmissionStatus === "APPROVED" || selectedReport.SubmissionStatus === "REJECTED") ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Ghi chú đã nộp</div>
                    <div style={{ background: "#f8fafc", padding: 16, borderRadius: "var(--radius)", border: "1px solid var(--border)", minHeight: 60, fontSize: 14, whiteSpace: "pre-wrap" }}>
                      {selectedReport.Content || <span style={{ color: "var(--text-muted)" }}>Không có ghi chú.</span>}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Tệp đính kèm</div>
                    {selectedReport.FilePath ? (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#eff6ff", padding: "12px 16px", borderRadius: "var(--radius)", border: "1px solid #bfdbfe" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ width: 40, height: 40, borderRadius: 8, background: "#dbeafe", color: "#1d4ed8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>📄</div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 14 }}>{selectedReport.FileName}</div>
                            <div style={{ fontSize: 12, color: "#64748b" }}>{fmtMB(selectedReport.FileSize)}</div>
                          </div>
                        </div>
                        <a href={`${BACKEND_URL}${selectedReport.FilePath}`} target="_blank" rel="noreferrer"
                          style={{ background: "white", color: "var(--primary)", padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600, textDecoration: "none", border: "1px solid #bfdbfe" }}>
                          Tải xuống
                        </a>
                      </div>
                    ) : <div style={{ padding: "12px 16px", border: "1px dashed var(--border)", borderRadius: "var(--radius)", color: "var(--text-muted)", fontSize: 13 }}>Không có tệp đính kèm.</div>}
                  </div>
                </div>

              ) : !canEdit(selectedReport) ? (
                // CLOSED or overdue (not revision)
                <div style={{ textAlign: "center", padding: "30px 0", color: "#ef4444", fontWeight: 500 }}>
                  Bạn không thể nộp bài do mẫu báo cáo này đã đóng hoặc quá hạn.
                </div>

              ) : (
                // EDITABLE: no submission, PENDING, REVISION_REQUIRED
                <form id="submitForm" onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  {selectedReport.SubmissionStatus === "PENDING" && (
                    <div style={{ background: "#eff6ff", padding: "12px 16px", borderRadius: "var(--radius)", borderLeft: "4px solid var(--primary)", fontSize: 13, color: "var(--primary-dark)" }}>
                      Bài nộp đang chờ duyệt. Bạn vẫn có thể thay thế tệp trước khi giảng viên xét duyệt.
                    </div>
                  )}

                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Tải lên tệp báo cáo <span style={{ color: "#ef4444" }}>*</span></div>

                    {!file && !existingFileUrl ? (
                      <div
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={(e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files?.[0]) setFile(e.dataTransfer.files[0]); }}
                        onClick={() => document.getElementById("file-upload").click()}
                        style={{ border: `2px dashed ${isDragging ? "var(--primary)" : "var(--border)"}`, borderRadius: "var(--radius-lg)", padding: "40px 20px", textAlign: "center", background: isDragging ? "#eff6ff" : "#f8fafc", transition: "all 0.2s", cursor: "pointer" }}
                      >
                        <div style={{ fontSize: 32, marginBottom: 8 }}>☁️</div>
                        <h4 style={{ margin: "0 0 4px 0", fontSize: 15, fontWeight: 600 }}>Kéo thả hoặc nhấp để tải lên</h4>
                        <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)" }}>Chấp nhận PDF, DOCX, ZIP (Tối đa 10MB)</p>
                        <input id="file-upload" type="file" accept=".pdf,.doc,.docx,.zip" style={{ display: "none" }} onChange={(e) => { if (e.target.files?.[0]) setFile(e.target.files[0]); }} />
                      </div>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#eff6ff", padding: 16, borderRadius: "var(--radius-lg)", border: "1px solid #bfdbfe" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 16, overflow: "hidden" }}>
                          <div style={{ width: 48, height: 48, borderRadius: 10, background: "#dbeafe", color: "#1d4ed8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>📄</div>
                          <div style={{ overflow: "hidden" }}>
                            <div style={{ fontWeight: 600, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {file ? file.name : existingFileName}
                            </div>
                            <div style={{ fontSize: 12, color: "#64748b" }}>
                              {file ? fmtMB(file.size) : fmtMB(existingFileSize)}
                            </div>
                          </div>
                        </div>
                        <button type="button" onClick={handleRemoveFile}
                          style={{ background: "#fee2e2", color: "#ef4444", border: "none", width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, fontSize: 16 }}>
                          ✕
                        </button>
                      </div>
                    )}
                  </div>

                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Ghi chú thêm (Tùy chọn)</div>
                    <textarea
                      className="form-input form-input-no-icon"
                      rows="3"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Ghi chú thêm cho giảng viên..."
                      style={{ borderRadius: "var(--radius)" }}
                    />
                  </div>
                </form>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border)", display: "flex", gap: 12 }}>
              <button onClick={() => setIsModalOpen(false)} className="btn-primary"
                style={{ flex: 1, background: "var(--bg-page)", color: "var(--text-primary)", border: "1px solid var(--border)", boxShadow: "none" }}>
                Đóng
              </button>
              {canEdit(selectedReport) && (
                <button type="submit" form="submitForm" className="btn-primary"
                  style={{ flex: 1, opacity: (!file && !existingFileUrl) ? 0.5 : 1 }}
                  disabled={!file && !existingFileUrl}>
                  Xác nhận Nộp bài
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default StudentReports;
