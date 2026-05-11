import { useState } from "react";
import { reportAPI } from "../../services/api";
import { useToast } from "../../context/ToastContext";
import { FileText, File, Download, Eye, CalendarDays, Briefcase, User, MapPin } from "lucide-react";

const STATUS_MAP = {
  PENDING: { label: "Chờ duyệt", cls: "bg-amber-50 text-amber-600 border-amber-200" },
  APPROVED: { label: "Đã duyệt", cls: "bg-emerald-50 text-emerald-600 border-emerald-200" },
  REVISION_REQUIRED: { label: "Yêu cầu làm lại", cls: "bg-rose-50 text-rose-600 border-rose-200" },
  REJECTED: { label: "Từ chối", cls: "bg-slate-100 text-slate-600 border-slate-300" }
};

const ReportReviewModal = ({ report, onClose, onSuccess }) => {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  
  const [status, setStatus] = useState(report.Status || "PENDING");
  const [comment, setComment] = useState(report.LecturerComment || "");
  const [showPreview, setShowPreview] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!status) {
      toast.error("Vui lòng chọn trạng thái đánh giá.");
      return;
    }
    if ((status === "REJECTED" || status === "REVISION_REQUIRED") && !comment.trim()) {
      toast.error("Vui lòng nhập nhận xét/lý do từ chối.");
      return;
    }

    try {
      setLoading(true);
      await reportAPI.review(report.Type, report.Id, { status, comment });
      toast.success("Đánh giá báo cáo thành công.");
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || "Đánh giá thất bại.");
    } finally {
      setLoading(false);
    }
  };

  const currStatus = STATUS_MAP[report.Status] || { label: report.Status, cls: "" };
  const isPdf = report.FilePath?.toLowerCase().endsWith(".pdf");
  
  // Normalize file path for URL (replace backslashes with forward slashes)
  const normalizedPath = report.FilePath ? report.FilePath.replace(/\\/g, '/') : '';
  const cleanPath = normalizedPath.startsWith('/') ? normalizedPath.substring(1) : normalizedPath;
  const fileUrl = cleanPath ? `http://localhost:5000/${cleanPath}` : null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ padding: "20px" }}>
      <div className="modal-box" style={{ maxWidth: "1000px", width: "100%", maxHeight: "calc(100vh - 40px)", display: "flex", flexDirection: "column", borderRadius: "20px" }} onClick={e => e.stopPropagation()}>
        
        <div className="modal-header" style={{ padding: "24px 32px", borderBottom: "1px solid var(--border)" }}>
          <div className="modal-title-group" style={{ gap: "16px" }}>
            <span className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FileText size={24} />
            </span>
            <div>
              <h2 className="modal-title" style={{ fontSize: "22px" }}>Chi tiết & Đánh giá Báo cáo</h2>
              <p className="modal-subtitle" style={{ fontSize: "15px", marginTop: "4px" }}>
                {report.Type === 'FINAL' ? "Báo cáo Tổng kết" : `Báo cáo Tuần ${report.WeekNumber}`}
              </p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose} disabled={loading} style={{ background: "var(--bg-page)" }}>✕</button>
        </div>

        <div className="modal-body" style={{ overflowY: "auto", padding: "32px", background: "#f8fafc", display: "flex", flexDirection: "column", gap: "24px" }}>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Cột trái (Thông tin chung) */}
            <div className="lg:col-span-1 flex flex-col gap-6">
              
              {/* Card Sinh viên */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-2xl font-black mb-3 border-4 border-white shadow-sm ring-1 ring-slate-200">
                  {report.StudentName?.charAt(0)}
                </div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Sinh viên</div>
                <div className="font-bold text-slate-800 text-lg">{report.StudentName}</div>
                <div className="text-sm font-medium text-blue-600 mt-1">{report.StudentCode}</div>
              </div>

              {/* Card Thông tin */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <h4 className="text-xs font-bold text-slate-400 mb-4 uppercase tracking-wider">
                  Thông tin báo cáo
                </h4>
                <div className="flex flex-col gap-4">
                  <div>
                    <div className="text-xs text-slate-500 font-medium mb-1">Trạng thái</div>
                    <span className={`inline-flex px-2 py-1 rounded-md text-xs font-bold border ${currStatus.cls}`}>{currStatus.label}</span>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 font-medium mb-1">Đợt thực tập</div>
                    <div className="text-sm font-medium text-slate-800 flex items-center gap-1.5"><CalendarDays size={14} className="text-slate-400" /> {report.PeriodName}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 font-medium mb-1">Công ty tiếp nhận</div>
                    <div className="text-sm font-medium text-slate-800 flex items-center gap-1.5"><Briefcase size={14} className="text-slate-400" /> {report.CompanyName || "Chưa đăng ký"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 font-medium mb-1">Giảng viên HD</div>
                    <div className="text-sm font-medium text-slate-800 flex items-center gap-1.5"><User size={14} className="text-slate-400" /> {report.LecturerName || "Chưa phân công"}</div>
                  </div>
                </div>
              </div>

            </div>

            {/* Cột phải (Nội dung & File & Đánh giá) */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <h4 className="text-lg font-bold text-slate-800 mb-2">{report.Title || "Không có tiêu đề"}</h4>
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-slate-700 whitespace-pre-wrap min-h-[100px] text-sm leading-relaxed">
                  {report.Description || <span className="text-slate-400 italic">Không có nội dung mô tả.</span>}
                </div>
              </div>

              {/* File đính kèm */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <h4 className="text-xs font-bold text-slate-400 mb-4 uppercase tracking-wider">File đính kèm</h4>
                {report.FilePath ? (
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-blue-50/50 rounded-xl gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                          <File size={20} />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-800">Tệp tin đính kèm</div>
                          <div className="text-xs text-slate-500 mt-0.5">{isPdf ? "Tài liệu PDF" : "Tài liệu đính kèm"}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isPdf && (
                          <button 
                            type="button"
                            onClick={() => setShowPreview(!showPreview)}
                            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-semibold transition-all shadow-sm"
                          >
                            <Eye size={16} /> {showPreview ? "Đóng xem trước" : "Xem trước"}
                          </button>
                        )}
                        <a 
                          href={fileUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-semibold transition-all shadow-sm"
                        >
                          <Download size={16} /> Tải file
                        </a>
                      </div>
                    </div>
                    {showPreview && isPdf && (
                      <div className="w-full h-[500px] rounded-xl border border-slate-200 overflow-hidden bg-white shadow-inner">
                        <iframe src={fileUrl} title="PDF Preview" className="w-full h-full border-0" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 font-medium">
                    Sinh viên chưa nộp file đính kèm.
                  </div>
                )}
              </div>

              {/* Form Đánh giá */}
              <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <h4 className="text-xs font-bold text-slate-400 mb-4 uppercase tracking-wider">Đánh giá & Phản hồi</h4>
                
                <div className="grid grid-cols-1 gap-5">
                  <div className="form-group mb-0">
                    <label className="text-sm font-bold text-slate-700 mb-2 block">Cập nhật trạng thái <span className="text-rose-500">*</span></label>
                    <select
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm font-medium"
                      value={status}
                      onChange={e => setStatus(e.target.value)}
                      required
                    >
                      <option value="PENDING">Chờ duyệt</option>
                      <option value="APPROVED" disabled={!report.FilePath}>Đã duyệt (Yêu cầu có file)</option>
                      <option value="REVISION_REQUIRED">Yêu cầu làm lại</option>
                      <option value="REJECTED">Từ chối</option>
                    </select>
                  </div>

                  <div className="form-group mb-0">
                    <label className="text-sm font-bold text-slate-700 mb-2 block">Nhận xét / Phản hồi</label>
                    <textarea
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm resize-y min-h-[120px]"
                      value={comment}
                      onChange={e => setComment(e.target.value)}
                      placeholder="Nhập phản hồi cho sinh viên (Bắt buộc nếu yêu cầu làm lại hoặc từ chối)..."
                    ></textarea>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-100">
                  <button type="button" className="px-6 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors text-sm" onClick={onClose} disabled={loading}>
                    Đóng
                  </button>
                  <button type="submit" className="px-6 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-[0_4px_12px_rgba(37,99,235,0.2)] hover:shadow-[0_6px_16px_rgba(37,99,235,0.3)] hover:-translate-y-0.5 text-sm flex items-center gap-2" disabled={loading}>
                    {loading && <span className="spinner-white w-4 h-4"></span>}
                    Lưu đánh giá
                  </button>
                </div>

              </form>

            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default ReportReviewModal;
