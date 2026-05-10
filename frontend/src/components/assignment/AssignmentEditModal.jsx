import { useState } from "react";
import { assignmentAPI } from "../../services/api";
import { useToast } from "../../context/ToastContext";

const AssignmentEditModal = ({ assignment, periods, lecturers, onClose, onSuccess }) => {
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const [periodId, setPeriodId] = useState(assignment.PeriodId || "");
  const [lecturerId, setLecturerId] = useState(assignment.LecturerId || "");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!periodId || !lecturerId) {
      toast.error("Vui lòng chọn đầy đủ Đợt thực tập và Giảng viên.");
      return;
    }

    try {
      setLoading(true);
      await assignmentAPI.update(assignment.AssignmentId, {
        periodId: parseInt(periodId),
        lecturerId: parseInt(lecturerId)
      });
      toast.success("Cập nhật phân công thành công!");
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || "Cập nhật thất bại.");
    } finally {
      setLoading(false);
    }
  };

  const activePeriods = periods.filter(p => p.Status !== 'CLOSED' || p.PeriodId === assignment.PeriodId);
  const activeLecturers = lecturers.filter(l => l.IsActive === 1 || l.IsActive === true || l.LecturerId === assignment.LecturerId);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: "600px" }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <span className="modal-icon">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </span>
            <div>
              <h2 className="modal-title">Chỉnh sửa Phân công</h2>
              <p className="modal-subtitle">Sinh viên: {assignment.StudentName} ({assignment.StudentCode})</p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose} disabled={loading}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="p-4 bg-slate-50 border rounded-lg mb-4 text-sm">
            <div className="text-slate-600">Công ty thực tập: <strong className="text-slate-800">{assignment.CompanyName || "Chưa có"}</strong></div>
            <div className="text-slate-600 mt-1">Lớp: {assignment.ClassName}</div>
            <div className="text-xs text-amber-600 mt-2">* Thông tin sinh viên và công ty không thể thay đổi thủ công tại đây.</div>
          </div>

          <div className="form-group">
            <label className="form-label">
              Đợt thực tập <span className="required">*</span>
            </label>
            <select
              className="form-input form-input-no-icon"
              value={periodId}
              onChange={e => setPeriodId(e.target.value)}
              required
            >
              <option value="">-- Chọn đợt thực tập --</option>
              {activePeriods.map(p => (
                <option key={p.PeriodId} value={p.PeriodId}>{p.PeriodName} ({p.Semester} - {p.AcademicYear})</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">
              Giảng viên hướng dẫn <span className="required">*</span>
            </label>
            <select
              className="form-input form-input-no-icon"
              value={lecturerId}
              onChange={e => setLecturerId(e.target.value)}
              required
            >
              <option value="">-- Chọn giảng viên --</option>
              {activeLecturers.map(l => (
                <option key={l.LecturerId} value={l.LecturerId}>
                  {l.FullName} ({l.LecturerCode}) - Khoa: {l.Department || "Chưa cập nhật"}
                </option>
              ))}
            </select>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
              Hủy
            </button>
            <button type="submit" className="btn-primary-sm" disabled={loading}>
              {loading ? <><span className="spinner"></span> Đang lưu...</> : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssignmentEditModal;
