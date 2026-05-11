import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { lecturerReportAPI } from "../services/api";

const BACKEND_URL = "http://localhost:5000";

const LecturerReports = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [periods, setPeriods] = useState([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState("");
  
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modals
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState(null);
  const [templateFormData, setTemplateFormData] = useState({ Title: "", ReportType: "WEEKLY", WeekNumber: "", OpenDate: "", DueDate: "", Description: "", Status: "OPEN" });

  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [reviewFormData, setReviewFormData] = useState({ Status: "", LecturerComment: "" });

  useEffect(() => {
    fetchPeriods();
  }, []);

  useEffect(() => {
    if (selectedPeriodId) {
      fetchTemplates(selectedPeriodId);
      setSelectedTemplateId(null);
      setSubmissions([]);
    }
  }, [selectedPeriodId]);

  useEffect(() => {
    if (selectedTemplateId) {
      fetchSubmissions(selectedTemplateId);
    }
  }, [selectedTemplateId]);

  const fetchPeriods = async () => {
    try {
      const res = await lecturerReportAPI.getPeriods();
      setPeriods(res.data.data);
      if (res.data.data.length > 0) {
        setSelectedPeriodId(res.data.data[0].PeriodId);
      }
      // Auto-open create modal if ?create=true
      if (searchParams.get("create") === "true") {
        setEditingTemplateId(null);
        setTemplateFormData({ Title: "", ReportType: "WEEKLY", WeekNumber: "", OpenDate: "", DueDate: "", Description: "", Status: "OPEN" });
        setIsTemplateModalOpen(true);
        setSearchParams({});
      }
    } catch (err) {
      toast.error("Lỗi khi tải danh sách kỳ thực tập");
    }
  };

  const fetchTemplates = async (periodId) => {
    try {
      setLoading(true);
      const res = await lecturerReportAPI.getTemplates({ periodId });
      setTemplates(res.data.data);
    } catch (err) {
      toast.error("Lỗi khi tải danh sách báo cáo");
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissions = async (templateId) => {
    try {
      setLoading(true);
      const res = await lecturerReportAPI.getSubmissions({ templateId });
      setSubmissions(res.data.data);
    } catch (err) {
      toast.error("Lỗi khi tải danh sách bài nộp");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTemplate = async (e) => {
    e.preventDefault();
    try {
      if (editingTemplateId) {
        await lecturerReportAPI.updateTemplate(editingTemplateId, templateFormData);
        toast.success("Đã cập nhật kỳ báo cáo thành công");
      } else {
        await lecturerReportAPI.createTemplate({ ...templateFormData, PeriodId: selectedPeriodId });
        toast.success("Đã tạo kỳ báo cáo thành công");
      }
      setIsTemplateModalOpen(false);
      fetchTemplates(selectedPeriodId);
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi khi lưu kỳ báo cáo");
    }
  };

  const handleDeleteTemplate = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("Bạn có chắc chắn muốn xóa kỳ báo cáo này?")) return;
    try {
      await lecturerReportAPI.deleteTemplate(id);
      toast.success("Đã xóa kỳ báo cáo");
      if (selectedTemplateId === id) setSelectedTemplateId(null);
      fetchTemplates(selectedPeriodId);
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi khi xóa kỳ báo cáo");
    }
  };

  const handleReviewSubmission = async (e) => {
    e.preventDefault();
    try {
      await lecturerReportAPI.reviewSubmission(selectedSubmission.ReportId, reviewFormData);
      toast.success("Đã đánh giá báo cáo");
      setSelectedSubmission(null);
      fetchSubmissions(selectedTemplateId);
      fetchTemplates(selectedPeriodId); // Update pending count
    } catch (err) {
      toast.error("Lỗi khi đánh giá báo cáo");
    }
  };

  const selectedPeriod = periods.find(p => p.PeriodId == selectedPeriodId);
  const isPeriodClosed = selectedPeriod?.Status === 'CLOSED';

  const formatDateTime = (dateStr) => {
    return new Date(dateStr).toLocaleString('vi-VN', { 
      day: '2-digit', month: '2-digit', year: 'numeric', 
      hour: '2-digit', minute: '2-digit' 
    });
  };

  const formatDateForInput = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  };

  const getDeadlineColor = (dueDateStr, status) => {
    if (status === 'CLOSED') return 'var(--text-muted)';
    const dueDate = new Date(dueDateStr);
    const now = new Date();
    const diffDays = (dueDate - now) / (1000 * 60 * 60 * 24);
    if (diffDays < 0) return '#ef4444'; // Overdue red
    if (diffDays <= 3) return '#f97316'; // Near orange
    return 'var(--text-secondary)'; // Normal slate
  };

  const currentEditTemplate = templates.find(t => t.TemplateId === editingTemplateId);
  const hasSubmissions = currentEditTemplate && currentEditTemplate.TotalSubmissions > 0;

  return (
    <>
      {/* TOPBAR */}
      <div className="topbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div className="topbar-title">Quản lý Báo cáo</div>
          <div className="topbar-subtitle">Kiểm duyệt và đánh giá báo cáo của sinh viên</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <select 
            className="form-input" 
            style={{ minWidth: '250px', fontWeight: 600, background: '#f8fafc', border: '1px solid #cbd5e1' }}
            value={selectedPeriodId}
            onChange={(e) => setSelectedPeriodId(e.target.value)}
          >
            {periods.length === 0 ? <option value="">Không có kỳ thực tập</option> : null}
            {periods.map(p => (
              <option key={p.PeriodId} value={p.PeriodId}>
                {p.PeriodName} ({p.Semester} - {p.AcademicYear}) {p.Status === 'CLOSED' ? '[ĐÃ ĐÓNG]' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="page-content" style={{ display: 'flex', gap: '24px', height: 'calc(100vh - 160px)', minHeight: '600px' }}>
        
        {/* LEFT PANEL: TEMPLATES */}
        <div style={{ width: '350px', display: 'flex', flexDirection: 'column', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden', flexShrink: 0 }}>
          <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>Kỳ báo cáo</h3>
            {!isPeriodClosed && selectedPeriodId && (
              <button 
                onClick={() => {
                  setEditingTemplateId(null);
                  setTemplateFormData({ Title: "", ReportType: "WEEKLY", WeekNumber: "", OpenDate: "", DueDate: "", Description: "", Status: "OPEN" });
                  setIsTemplateModalOpen(true);
                }} 
                className="btn-primary" 
                style={{ padding: '6px 12px', fontSize: '12px', width: 'auto' }}
              >
                + Tạo mới
              </button>
            )}
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {templates.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                Chưa có kỳ báo cáo nào.
              </div>
            ) : (
              templates.map(tpl => {
                const isSelected = selectedTemplateId === tpl.TemplateId;
                return (
                  <div 
                    key={tpl.TemplateId}
                    onClick={() => setSelectedTemplateId(tpl.TemplateId)}
                    style={{
                      padding: '16px',
                      borderRadius: 'var(--radius)',
                      border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                      background: isSelected ? '#eff6ff' : 'white',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: isSelected ? '0 2px 8px rgba(59,130,246,0.15)' : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: isSelected ? 'var(--primary-dark)' : 'var(--text-primary)' }}>
                        {tpl.Title}
                      </h4>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {tpl.PendingCount > 0 && (
                          <span style={{ background: '#ef4444', color: 'white', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '12px' }}>
                            {tpl.PendingCount} mới
                          </span>
                        )}
                        {!isPeriodClosed && (
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingTemplateId(tpl.TemplateId);
                                setTemplateFormData({ 
                                  Title: tpl.Title, ReportType: tpl.ReportType, WeekNumber: tpl.WeekNumber || "", 
                                  OpenDate: formatDateForInput(tpl.OpenDate), DueDate: formatDateForInput(tpl.DueDate), 
                                  Description: tpl.Description || "", Status: tpl.Status 
                                });
                                setIsTemplateModalOpen(true);
                              }}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--primary)' }}
                              title="Chỉnh sửa"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            </button>
                            {tpl.TotalSubmissions === 0 && (
                              <button 
                                onClick={(e) => handleDeleteTemplate(e, tpl.TemplateId)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#ef4444' }}
                                title="Xóa"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                        <span>Loại: {tpl.ReportType === 'WEEKLY' ? `Tuần ${tpl.WeekNumber || ''}` : 'Cuối kỳ'}</span>
                        <span style={{ fontWeight: 600, color: tpl.Status === 'OPEN' ? '#16a34a' : '#94a3b8' }}>
                          {tpl.Status === 'OPEN' ? 'ĐANG MỞ' : 'ĐÃ ĐÓNG'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: getDeadlineColor(tpl.DueDate, tpl.Status), fontWeight: getDeadlineColor(tpl.DueDate, tpl.Status) !== 'var(--text-secondary)' ? 600 : 400 }}>
                        <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Hạn: {formatDateTime(tpl.DueDate)}
                      </div>
                      <div style={{ marginTop: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed var(--border)', paddingTop: '8px', color: 'var(--text-secondary)' }}>
                        <span>Đã nộp: {tpl.TotalSubmissions}</span>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* RIGHT PANEL: SUBMISSIONS */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
          {!selectedTemplateId ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              <svg className="w-16 h-16 text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>Chưa chọn kỳ báo cáo</h3>
              <p>Vui lòng chọn một kỳ báo cáo ở danh sách bên trái để xem bài nộp.</p>
            </div>
          ) : (
            <>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>Danh sách bài nộp</h3>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {submissions.length} sinh viên đã nộp báo cáo
                  </div>
                </div>
              </div>
              
              <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px', alignContent: 'start' }}>
                {loading ? (
                  <div className="col-span-full flex justify-center py-10"><div className="spinner"></div></div>
                ) : submissions.length === 0 ? (
                  <div className="col-span-full text-center text-slate-500 py-10">Chưa có sinh viên nào nộp báo cáo.</div>
                ) : (
                  submissions.map(sub => {
                    const initials = sub.FullName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
                    
                    let statusColor = "#eab308"; let statusBg = "#fef3c7"; let statusText = "Chờ duyệt";
                    if (sub.Status === 'APPROVED') { statusColor = "#16a34a"; statusBg = "#dcfce7"; statusText = "Đã duyệt"; }
                    if (sub.Status === 'REVISION_REQUIRED') { statusColor = "#f97316"; statusBg = "#ffedd5"; statusText = "Cần sửa"; }
                    if (sub.Status === 'REJECTED') { statusColor = "#ef4444"; statusBg = "#fee2e2"; statusText = "Từ chối"; }

                    return (
                      <div key={sub.ReportId} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary-light), var(--primary))', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 700 }}>
                            {initials}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub.FullName}</h4>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>MSSV: {sub.StudentCode}</div>
                          </div>
                          <div style={{ background: statusBg, color: statusColor, padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, whiteSpace: 'nowrap' }}>
                            {statusText}
                          </div>
                        </div>
                        
                        <div style={{ background: '#f8fafc', padding: '12px', borderRadius: 'var(--radius-sm)', fontSize: '13px' }}>
                          <div style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>Thời gian nộp:</div>
                          <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{formatDateTime(sub.SubmittedAt)}</div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', marginTop: 'auto' }}>
                          <button 
                            onClick={() => {
                              setSelectedSubmission(sub);
                              setReviewFormData({ Status: sub.Status, LecturerComment: sub.LecturerComment || "" });
                            }}
                            className="btn-primary" 
                            style={{ flex: 1, padding: '8px', fontSize: '13px' }}
                          >
                            Xem & Đánh giá
                          </button>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* CREATE TEMPLATE MODAL */}
      {isTemplateModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'white', width: '100%', maxWidth: '500px', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>{editingTemplateId ? 'Chỉnh sửa kỳ báo cáo' : 'Tạo kỳ báo cáo mới'}</h3>
              <button onClick={() => setIsTemplateModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <form onSubmit={handleSaveTemplate} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="form-label">Tiêu đề</label>
                <input required type="text" className="form-input form-input-no-icon" value={templateFormData.Title} onChange={(e) => setTemplateFormData({...templateFormData, Title: e.target.value})} placeholder="VD: Báo cáo tuần 1" />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label className="form-label">Loại báo cáo</label>
                  <select required className="form-input form-input-no-icon" value={templateFormData.ReportType} onChange={(e) => setTemplateFormData({...templateFormData, ReportType: e.target.value})} disabled={hasSubmissions}>
                    <option value="WEEKLY">Báo cáo tuần</option>
                    <option value="FINAL">Báo cáo cuối kỳ</option>
                  </select>
                </div>
                {templateFormData.ReportType === 'WEEKLY' && (
                  <div>
                    <label className="form-label">Tuần số</label>
                    <input required type="number" min="1" className="form-input form-input-no-icon" value={templateFormData.WeekNumber} onChange={(e) => setTemplateFormData({...templateFormData, WeekNumber: e.target.value})} disabled={hasSubmissions} />
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label className="form-label">Ngày mở</label>
                  <input required type="datetime-local" className="form-input form-input-no-icon" value={templateFormData.OpenDate} onChange={(e) => setTemplateFormData({...templateFormData, OpenDate: e.target.value})} />
                </div>
                <div>
                  <label className="form-label">Hạn chót</label>
                  <input required type="datetime-local" className="form-input form-input-no-icon" value={templateFormData.DueDate} onChange={(e) => setTemplateFormData({...templateFormData, DueDate: e.target.value})} />
                </div>
              </div>

              {editingTemplateId && (
                <div>
                  <label className="form-label">Trạng thái</label>
                  <select required className="form-input form-input-no-icon" value={templateFormData.Status} onChange={(e) => setTemplateFormData({...templateFormData, Status: e.target.value})}>
                    <option value="OPEN">Đang mở (Nhận bài)</option>
                    <option value="CLOSED">Đã đóng (Ngừng nhận)</option>
                  </select>
                </div>
              )}

              <div>
                <label className="form-label">Mô tả / Yêu cầu</label>
                <textarea className="form-input form-input-no-icon" rows="3" value={templateFormData.Description} onChange={(e) => setTemplateFormData({...templateFormData, Description: e.target.value})} placeholder="Nhập mô tả yêu cầu cho sinh viên..."></textarea>
              </div>

              {hasSubmissions && (
                <div style={{ fontSize: '12px', color: '#f97316', background: '#ffedd5', padding: '8px', borderRadius: '4px' }}>
                  * Không thể thay đổi "Loại báo cáo" và "Tuần số" do kỳ báo cáo này đã có sinh viên nộp bài.
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button type="button" onClick={() => setIsTemplateModalOpen(false)} className="btn-primary" style={{ flex: 1, background: 'var(--bg-page)', color: 'var(--text-primary)', border: '1px solid var(--border)', boxShadow: 'none' }}>Hủy</button>
                <button type="submit" className="btn-primary" style={{ flex: 2 }}>{editingTemplateId ? 'Lưu thay đổi' : 'Tạo mới'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REVIEW SUBMISSION MODAL / DRAWER */}
      {selectedSubmission && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', justifyContent: 'flex-end', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'white', width: '100%', maxWidth: '600px', height: '100%', display: 'flex', flexDirection: 'column', boxShadow: '-5px 0 25px rgba(0,0,0,0.1)', animation: 'slideInRight 0.3s ease-out' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: '#f8fafc' }}>
              <div>
                <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: 800 }}>Chi tiết bài nộp</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ fontWeight: 600, color: 'var(--primary)' }}>{selectedSubmission.FullName}</div>
                  <span style={{ color: 'var(--border)' }}>|</span>
                  <div style={{ color: 'var(--text-secondary)' }}>MSSV: {selectedSubmission.StudentCode}</div>
                </div>
              </div>
              <button onClick={() => setSelectedSubmission(null)} style={{ background: '#f1f5f9', border: 'none', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              <div>
                <h4 style={{ fontSize: '13px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '8px', letterSpacing: '0.5px' }}>Nội dung báo cáo</h4>
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', minHeight: '150px', fontSize: '14px', lineHeight: 1.6, color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
                  {selectedSubmission.Content || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Không có nội dung văn bản.</span>}
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: '13px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '8px', letterSpacing: '0.5px' }}>Tài liệu đính kèm</h4>
                {selectedSubmission.FilePath ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', border: '1px solid #bfdbfe', borderRadius: 'var(--radius)', background: '#eff6ff' }}>
                    <div style={{ width: '48px', height: '48px', background: '#dbeafe', color: '#1d4ed8', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0 }}>
                      📄
                    </div>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div style={{ fontWeight: 600, fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selectedSubmission.FileName || 'Tệp đính kèm'}</div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                        {selectedSubmission.FileSize ? `${(selectedSubmission.FileSize / 1048576).toFixed(2)} MB` : ''}
                        {selectedSubmission.SubmittedAt && <span style={{ marginLeft: '8px' }}>• {new Date(selectedSubmission.SubmittedAt).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                      <a href={`${BACKEND_URL}${selectedSubmission.FilePath}`} target="_blank" rel="noreferrer"
                        style={{ background: 'white', color: 'var(--primary)', padding: '8px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 600, textDecoration: 'none', border: '1px solid #bfdbfe' }}>
                        Xem file
                      </a>
                      <a href={`${BACKEND_URL}${selectedSubmission.FilePath}`} download={selectedSubmission.FileName || true}
                        style={{ background: 'var(--primary)', color: 'white', padding: '8px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
                        Tải xuống
                      </a>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '12px 16px', border: '1px dashed var(--border)', borderRadius: 'var(--radius)', color: 'var(--text-muted)', fontSize: '13px' }}>
                    Không có tệp đính kèm
                  </div>
                )}
              </div>

              <div style={{ height: '1px', background: 'var(--border)' }}></div>

              <form id="reviewForm" onSubmit={handleReviewSubmission} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <h4 style={{ fontSize: '13px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '12px', letterSpacing: '0.5px' }}>Đánh giá của giảng viên</h4>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', border: `1px solid ${reviewFormData.Status === 'APPROVED' ? '#16a34a' : 'var(--border)'}`, background: reviewFormData.Status === 'APPROVED' ? '#dcfce7' : 'white', borderRadius: 'var(--radius)', cursor: 'pointer', transition: 'all 0.2s' }}>
                      <input type="radio" name="status" value="APPROVED" checked={reviewFormData.Status === 'APPROVED'} onChange={(e) => setReviewFormData({...reviewFormData, Status: e.target.value})} style={{ accentColor: '#16a34a' }} disabled={isPeriodClosed} />
                      <span style={{ fontWeight: 600, color: reviewFormData.Status === 'APPROVED' ? '#166534' : 'var(--text-primary)' }}>Duyệt báo cáo</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', border: `1px solid ${reviewFormData.Status === 'REVISION_REQUIRED' ? '#f97316' : 'var(--border)'}`, background: reviewFormData.Status === 'REVISION_REQUIRED' ? '#ffedd5' : 'white', borderRadius: 'var(--radius)', cursor: 'pointer', transition: 'all 0.2s' }}>
                      <input type="radio" name="status" value="REVISION_REQUIRED" checked={reviewFormData.Status === 'REVISION_REQUIRED'} onChange={(e) => setReviewFormData({...reviewFormData, Status: e.target.value})} style={{ accentColor: '#f97316' }} disabled={isPeriodClosed} />
                      <span style={{ fontWeight: 600, color: reviewFormData.Status === 'REVISION_REQUIRED' ? '#9a3412' : 'var(--text-primary)' }}>Yêu cầu sửa lại</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', border: `1px solid ${reviewFormData.Status === 'REJECTED' ? '#ef4444' : 'var(--border)'}`, background: reviewFormData.Status === 'REJECTED' ? '#fee2e2' : 'white', borderRadius: 'var(--radius)', cursor: 'pointer', transition: 'all 0.2s' }}>
                      <input type="radio" name="status" value="REJECTED" checked={reviewFormData.Status === 'REJECTED'} onChange={(e) => setReviewFormData({...reviewFormData, Status: e.target.value})} style={{ accentColor: '#ef4444' }} disabled={isPeriodClosed} />
                      <span style={{ fontWeight: 600, color: reviewFormData.Status === 'REJECTED' ? '#991b1b' : 'var(--text-primary)' }}>Từ chối</span>
                    </label>
                  </div>

                  <div>
                    <label className="form-label">Nhận xét / Góp ý</label>
                    <textarea 
                      className="form-input form-input-no-icon" 
                      rows="4" 
                      value={reviewFormData.LecturerComment} 
                      onChange={(e) => setReviewFormData({...reviewFormData, LecturerComment: e.target.value})} 
                      placeholder="Nhập nhận xét của bạn để sinh viên có thể cải thiện..."
                      disabled={isPeriodClosed}
                    ></textarea>
                  </div>
                </div>
              </form>
            </div>
            
            <div style={{ padding: '20px 24px', borderTop: '1px solid var(--border)', background: 'white', display: 'flex', gap: '12px' }}>
              <button type="button" onClick={() => setSelectedSubmission(null)} className="btn-primary" style={{ flex: 1, background: 'var(--bg-page)', color: 'var(--text-primary)', border: '1px solid var(--border)', boxShadow: 'none' }}>
                Đóng
              </button>
              {!isPeriodClosed && (
                <button type="submit" form="reviewForm" className="btn-primary" style={{ flex: 2 }}>
                  Lưu đánh giá
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}} />
    </>
  );
};

export default LecturerReports;
