import { useState, useEffect } from "react";
import { assignmentAPI } from "../../services/api";
import { useToast } from "../../context/ToastContext";

const Row = ({ label, value }) => (
  <div className="detail-row">
    <div className="detail-label">{label}</div>
    <div className="detail-value">{value || <span className="text-slate-400 italic">Không có thông tin</span>}</div>
  </div>
);

const STATUS_MAP = {
  NOT_STARTED: { label: "Chưa bắt đầu", cls: "status-not-started" },
  IN_PROGRESS: { label: "Đang thực tập", cls: "status-in-progress" },
  COMPLETED: { label: "Hoàn thành", cls: "status-completed" },
};

const REPORT_STATUS = {
  PENDING: { label: "Đang chờ duyệt", cls: "text-amber-600 bg-amber-50" },
  APPROVED: { label: "Đã duyệt", cls: "text-green-600 bg-green-50" },
  REVISION_REQUIRED: { label: "Yêu cầu làm lại", cls: "text-red-600 bg-red-50" },
  REJECTED: { label: "Từ chối", cls: "text-red-600 bg-red-50" },
};

const AssignmentDetailModal = ({ assignmentId, onClose }) => {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await assignmentAPI.getById(assignmentId);
        setData(res.data.data);
      } catch (err) {
        toast.error("Không thể tải chi tiết phân công.");
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [assignmentId, toast]);

  if (loading) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-box" style={{ maxWidth: "600px" }} onClick={e => e.stopPropagation()}>
          <div className="flex flex-col items-center justify-center py-10">
            <div className="spinner-blue"></div>
            <p className="mt-4 text-slate-500">Đang tải dữ liệu...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const status = STATUS_MAP[data.InternshipStatus] || STATUS_MAP["NOT_STARTED"];
  const fStatus = REPORT_STATUS[data.FinalReportStatus] || { label: "Chưa nộp", cls: "text-slate-500 bg-slate-100" };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: "800px", width: "95vw", maxHeight: "90vh", display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}>

        <div className="modal-header">
          <div className="modal-title-group">
            <span className="modal-icon">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </span>
            <div>
              <h2 className="modal-title">Chi tiết Phân công hướng dẫn</h2>
              <p className="modal-subtitle">Hồ sơ theo dõi thực tập sinh viên</p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body" style={{ overflowY: "auto", paddingBottom: "24px" }}>

          <div className="detail-section" style={{ marginBottom: "24px" }}>
            <h4 className="detail-section-title">Thông tin Sinh viên</h4>
            <div className="grid grid-cols-2 gap-x-8">
              <Row label="Họ và tên" value={<span className="font-semibold text-blue-700">{data.StudentName}</span>} />
              <Row label="MSSV" value={data.StudentCode} />
              <Row label="Lớp" value={data.ClassName} />
              <Row label="Email" value={data.StudentEmail} />
            </div>
          </div>

          <div className="detail-section" style={{ marginBottom: "24px" }}>
            <h4 className="detail-section-title">Thông tin Đợt thực tập & Công ty</h4>
            <div className="grid grid-cols-2 gap-x-8">
              <Row label="Đợt thực tập" value={data.PeriodName} />
              <Row label="Học kỳ / Năm" value={`${data.Semester} - ${data.AcademicYear}`} />
              <Row label="Công ty tiếp nhận" value={<span className="font-semibold text-slate-800">{data.CompanyName || "Chưa đăng ký"}</span>} />
              <Row label="Trạng thái" value={<span className={`sm-status-badge ${status.cls}`}>{status.label}</span>} />
            </div>
          </div>

          <div className="detail-section" style={{ marginBottom: "24px" }}>
            <h4 className="detail-section-title">Thông tin Giảng viên hướng dẫn</h4>
            <div className="grid grid-cols-2 gap-x-8">
              <Row label="Giảng viên" value={<span className="font-semibold text-purple-700">{data.LecturerName}</span>} />
              <Row label="Mã GV" value={data.LecturerCode} />
              <Row label="Khoa" value={data.LecturerDepartment} />
              <Row label="Ngày phân công" value={data.AssignedDate ? new Date(data.AssignedDate).toLocaleDateString("vi-VN") : "—"} />
            </div>
          </div>

          <div className="detail-section">
            <h4 className="detail-section-title">Tiến độ & Kết quả (Tạm tính)</h4>
            <div className="grid grid-cols-2 gap-x-8">
              <Row label="Báo cáo tuần đã duyệt" value={<span className="font-medium text-green-600">{data.CompletedWeeklyReports || 0} báo cáo</span>} />
              <Row label="Báo cáo tổng kết" value={<span className={`px-2 py-1 text-xs font-medium rounded ${fStatus.cls}`}>{fStatus.label}</span>} />
              <Row label="Điểm đánh giá GV" value={data.EvaluationScore !== null && data.EvaluationScore !== undefined ? <strong className="text-blue-600 text-lg">{data.EvaluationScore}đ</strong> : <span className="text-slate-400">Chưa có điểm</span>} />
              <Row label="GPA (Học vụ)" value={data.GPA !== null && data.GPA !== undefined ? <strong className="text-slate-700">{data.GPA}</strong> : "—"} />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AssignmentDetailModal;
