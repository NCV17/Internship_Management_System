import { useState } from "react";
import { studentAPI } from "../../services/api";
import { useToast } from "../../context/ToastContext";

const StudentCreateModal = ({ onClose, onSuccess }) => {
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    studentCode: "",
    fullName: "",
    className: "",
    email: "",
    phone: "",
    password: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.studentCode.trim() || !formData.fullName.trim() || !formData.password) {
      toast.error("Vui lòng điền đủ MSSV, Họ tên và Mật khẩu.");
      return;
    }
    if (formData.password.length < 6) {
      toast.error("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }

    try {
      setLoading(true);
      await studentAPI.create(formData);
      toast.success("Thêm sinh viên thành công!");
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || "Thêm sinh viên thất bại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: "600px" }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <span className="modal-icon">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </span>
            <div>
              <h2 className="modal-title">Thêm sinh viên mới</h2>
              <p className="modal-subtitle">Khởi tạo tài khoản và hồ sơ thực tập</p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose} disabled={loading}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="modal-row-2">
            <div className="form-group">
              <label className="form-label">
                MSSV <span className="required">*</span>
              </label>
              <input
                type="text"
                name="studentCode"
                className="form-input form-input-no-icon"
                value={formData.studentCode}
                onChange={handleChange}
                placeholder="VD: 19110001"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Lớp</label>
              <input
                type="text"
                name="className"
                className="form-input form-input-no-icon"
                value={formData.className}
                onChange={handleChange}
                placeholder="VD: 19TCLC_DT1"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              Họ và tên <span className="required">*</span>
            </label>
            <input
              type="text"
              name="fullName"
              className="form-input form-input-no-icon"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="VD: Nguyễn Văn A"
              required
            />
          </div>

          <div className="modal-row-2">
            <div className="form-group">
              <label className="form-label">Email cá nhân</label>
              <input
                type="email"
                name="email"
                className="form-input form-input-no-icon"
                value={formData.email}
                onChange={handleChange}
                placeholder="VD: nguyenvena@gmail.com"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Số điện thoại</label>
              <input
                type="text"
                name="phone"
                className="form-input form-input-no-icon"
                value={formData.phone}
                onChange={handleChange}
                placeholder="VD: 0987654321"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              Mật khẩu đăng nhập <span className="required">*</span>
            </label>
            <input
              type="password"
              name="password"
              className="form-input form-input-no-icon"
              value={formData.password}
              onChange={handleChange}
              placeholder="Ít nhất 6 ký tự"
              required
              minLength={6}
            />
            <div style={{ marginTop: "6px", fontSize: "12px", color: "var(--text-muted)", display: "flex", alignItems: "center" }}>
              <svg className="w-3.5 h-3.5 mr-1 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Mật khẩu mặc định cấp cho sinh viên đăng nhập hệ thống.
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
              Hủy
            </button>
            <button type="submit" className="btn-primary-sm" disabled={loading}>
              {loading ? <><span className="spinner"></span> Đang xử lý...</> : "Thêm sinh viên"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentCreateModal;
