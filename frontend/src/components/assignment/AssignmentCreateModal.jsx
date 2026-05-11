import { useState, useEffect } from "react";
import { assignmentAPI } from "../../services/api";
import { useToast } from "../../context/ToastContext";

const AssignmentCreateModal = ({ periods, lecturers, onClose, onSuccess }) => {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  
  const [periodId, setPeriodId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [lecturerId, setLecturerId] = useState("");

  const [eligibleStudents, setEligibleStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  useEffect(() => {
    if (!periodId) {
      setEligibleStudents([]);
      setStudentId("");
      return;
    }
    const fetchStudents = async () => {
      try {
        setLoadingStudents(true);
        const res = await assignmentAPI.getEligibleStudents(periodId);
        setEligibleStudents(res.data.data);
        setStudentId(""); // Reset selection
      } catch (err) {
        toast.error("Không thể tải danh sách sinh viên hợp lệ.");
      } finally {
        setLoadingStudents(false);
      }
    };
    fetchStudents();
  }, [periodId, toast]);

  const selectedStudentData = eligibleStudents.find(s => String(s.StudentId) === String(studentId));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!periodId || !studentId || !lecturerId) {
      toast.error("Vui lòng chọn đầy đủ Đợt thực tập, Sinh viên và Giảng viên.");
      return;
    }

    try {
      setLoading(true);
      await assignmentAPI.create({
        periodId: parseInt(periodId),
        studentId: parseInt(studentId),
        lecturerId: parseInt(lecturerId)
      });
      toast.success("Phân công hướng dẫn thành công!");
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || "Phân công thất bại.");
    } finally {
      setLoading(false);
    }
  };

  // Only active periods
  const activePeriods = periods.filter(p => p.Status !== 'CLOSED');
  // Only active lecturers
  const activeLecturers = lecturers.filter(l => l.IsActive === 1 || l.IsActive === true);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: "600px" }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <span className="modal-icon">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </span>
            <div>
              <h2 className="modal-title">Phân công Hướng dẫn mới</h2>
              <p className="modal-subtitle">Gán giảng viên theo dõi sinh viên thực tập</p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose} disabled={loading}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          
          <div className="form-group">
            <label className="form-label">
              1. Đợt thực tập <span className="required">*</span>
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
              2. Chọn Sinh viên <span className="required">*</span>
            </label>
            <select
              className="form-input form-input-no-icon"
              value={studentId}
              onChange={e => setStudentId(e.target.value)}
              required
              disabled={!periodId || loadingStudents}
            >
              <option value="">{loadingStudents ? "Đang tải..." : "-- Chọn sinh viên (đã đăng ký công ty) --"}</option>
              {eligibleStudents.map(s => (
                <option key={s.StudentId} value={s.StudentId}>
                  {s.StudentCode} - {s.FullName} ({s.ClassName})
                </option>
              ))}
            </select>
            {periodId && !loadingStudents && eligibleStudents.length === 0 && (
              <p className="text-xs text-amber-600 mt-2">Không có sinh viên nào đang chờ phân công trong đợt này (Sinh viên phải được duyệt đăng ký Công ty trước).</p>
            )}
          </div>

          {selectedStudentData && (
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg mb-4 text-sm">
              <div className="font-semibold text-blue-800 mb-1">Thông tin thực tập:</div>
              <div className="text-blue-700">Công ty: <strong>{selectedStudentData.CompanyName}</strong></div>
              <div className="text-blue-700 mt-1">Lớp: {selectedStudentData.ClassName}</div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">
              3. Chọn Giảng viên hướng dẫn <span className="required">*</span>
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
              {loading ? <><span className="spinner"></span> Đang xử lý...</> : "Lưu phân công"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssignmentCreateModal;
