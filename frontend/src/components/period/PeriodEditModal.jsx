import { useState } from "react";
import { periodAPI } from "../../services/api";
import { useToast } from "../../context/ToastContext";

const PeriodEditModal = ({ period, onClose, onSuccess }) => {
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    periodName: period.PeriodName || "",
    semester: period.Semester || "Học kỳ 1",
    academicYear: period.AcademicYear || "",
    startDate: period.StartDate ? new Date(period.StartDate).toISOString().split('T')[0] : "",
    endDate: period.EndDate ? new Date(period.EndDate).toISOString().split('T')[0] : "",
    status: period.Status || "UPCOMING",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      toast.error("Ngày kết thúc phải lớn hơn ngày bắt đầu.");
      return;
    }

    try {
      setLoading(true);
      await periodAPI.update(period.PeriodId, formData);
      toast.success("Cập nhật đợt thực tập thành công!");
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || "Cập nhật đợt thực tập thất bại.");
    } finally {
      setLoading(false);
    }
  };

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
              <h2 className="modal-title">Chỉnh sửa đợt thực tập</h2>
              <p className="modal-subtitle">Cập nhật thông tin quản lý cho {period.PeriodName}</p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose} disabled={loading}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label className="form-label">
              Tên đợt thực tập <span className="required">*</span>
            </label>
            <input
              type="text"
              name="periodName"
              className="form-input form-input-no-icon"
              value={formData.periodName}
              onChange={handleChange}
              placeholder="VD: Đợt thực tập chính khóa K19"
              required
            />
          </div>

          <div className="modal-row-2">
            <div className="form-group">
              <label className="form-label">
                Học kỳ <span className="required">*</span>
              </label>
              <select name="semester" className="form-input form-input-no-icon" value={formData.semester} onChange={handleChange} required>
                <option value="Học kỳ 1">Học kỳ 1</option>
                <option value="Học kỳ 2">Học kỳ 2</option>
                <option value="Học kỳ hè">Học kỳ hè</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                Năm học <span className="required">*</span>
              </label>
              <input
                type="text"
                name="academicYear"
                className="form-input form-input-no-icon"
                value={formData.academicYear}
                onChange={handleChange}
                placeholder="VD: 2023-2024"
                required
              />
            </div>
          </div>

          <div className="modal-row-2">
            <div className="form-group">
              <label className="form-label">
                Ngày bắt đầu <span className="required">*</span>
              </label>
              <input
                type="date"
                name="startDate"
                className="form-input form-input-no-icon"
                value={formData.startDate}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Ngày kết thúc <span className="required">*</span>
              </label>
              <input
                type="date"
                name="endDate"
                className="form-input form-input-no-icon"
                value={formData.endDate}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Trạng thái</label>
            <select name="status" className="form-input form-input-no-icon" value={formData.status} onChange={handleChange}>
              <option value="UPCOMING">Sắp diễn ra</option>
              <option value="ACTIVE">Đang diễn ra</option>
              <option value="CLOSED">Đã đóng</option>
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

export default PeriodEditModal;
