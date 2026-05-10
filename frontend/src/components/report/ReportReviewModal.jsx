import { useState } from "react";
import { reportAPI } from "../../services/api";
import { useToast } from "../../context/ToastContext";

const STATUS_MAP = {
  PENDING: { label: "Chờ duyệt", cls: "text-amber-600 bg-amber-50" },
  APPROVED: { label: "Đã duyệt", cls: "text-green-600 bg-green-50" },
  REVISION_REQUIRED: { label: "Yêu cầu làm lại", cls: "text-red-600 bg-red-50" },
  REJECTED: { label: "Bị từ chối", cls: "text-slate-600 bg-slate-100" }
};

const ReportReviewModal = ({ report, onClose, onSuccess }) => {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  
  const [status, setStatus] = useState(report.Status || "PENDING");
  const [comment, setComment] = useState(report.LecturerComment || "");

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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: "700px" }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <span className="modal-icon">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </span>
            <div>
              <h2 className="modal-title">Chi tiết & Đánh giá Báo cáo</h2>
              <p className="modal-subtitle">Sinh viên: {report.StudentName} ({report.StudentCode})</p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose} disabled={loading}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body" style={{ maxHeight: "75vh", overflowY: "auto" }}>
          
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6 text-sm grid grid-cols-2 gap-4">
            <div><span className="text-slate-500">Loại báo cáo:</span> <strong className="text-slate-800">{report.Type === 'FINAL' ? "Báo cáo Tổng kết" : `Báo cáo Tuần ${report.WeekNumber}`}</strong></div>
            <div><span className="text-slate-500">Trạng thái hiện tại:</span> <span className={`px-2 py-1 ml-1 text-xs font-medium rounded ${currStatus.cls}`}>{currStatus.label}</span></div>
            <div className="col-span-2"><span className="text-slate-500">Đợt thực tập:</span> <strong className="text-slate-800">{report.PeriodName}</strong></div>
            <div className="col-span-2"><span className="text-slate-500">Công ty:</span> <strong className="text-slate-800">{report.CompanyName || "Chưa có"}</strong></div>
            <div className="col-span-2"><span className="text-slate-500">Giảng viên HD:</span> <strong className="text-slate-800">{report.LecturerName || "Chưa phân công"}</strong></div>
          </div>

          <div className="mb-6">
            <h4 className="font-semibold text-slate-800 mb-2">Tiêu đề báo cáo</h4>
            <div className="p-3 bg-white border border-slate-200 rounded-md text-slate-700">{report.Title || "Không có tiêu đề"}</div>
          </div>

          <div className="mb-6">
            <h4 className="font-semibold text-slate-800 mb-2">Nội dung / Mô tả</h4>
            <div className="p-4 bg-white border border-slate-200 rounded-md text-slate-700 whitespace-pre-wrap min-h-[100px]">
              {report.Description || <span className="text-slate-400 italic">Không có nội dung mô tả.</span>}
            </div>
          </div>

          <div className="mb-6">
            <h4 className="font-semibold text-slate-800 mb-2">File đính kèm</h4>
            {report.FilePath ? (
              <a 
                href={`http://localhost:5000/${report.FilePath}`} 
                target="_blank" 
                rel="noreferrer"
                className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors border border-blue-200"
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                Tải / Xem File Báo Cáo
              </a>
            ) : (
              <div className="p-3 bg-red-50 text-red-600 rounded-md text-sm border border-red-100">
                Sinh viên chưa nộp file báo cáo. Không thể duyệt.
              </div>
            )}
          </div>

          <hr className="my-6 border-slate-200" />
          <h4 className="font-semibold text-slate-800 mb-4">Đánh giá của Giảng viên / Admin</h4>

          <div className="form-group">
            <label className="form-label">Cập nhật trạng thái <span className="required">*</span></label>
            <select
              className="form-input form-input-no-icon"
              value={status}
              onChange={e => setStatus(e.target.value)}
              required
            >
              <option value="PENDING">Chờ duyệt</option>
              <option value="APPROVED" disabled={!report.FilePath}>Đã duyệt (Phải có file)</option>
              <option value="REVISION_REQUIRED">Yêu cầu làm lại</option>
              <option value="REJECTED">Từ chối</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Nhận xét / Phản hồi</label>
            <textarea
              className="form-input form-input-no-icon"
              rows="4"
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Nhập nhận xét cho sinh viên (bắt buộc nếu từ chối hoặc yêu cầu làm lại)..."
            ></textarea>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
              Hủy
            </button>
            <button type="submit" className="btn-primary-sm" disabled={loading}>
              {loading ? <><span className="spinner"></span> Đang xử lý...</> : "Lưu đánh giá"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportReviewModal;
