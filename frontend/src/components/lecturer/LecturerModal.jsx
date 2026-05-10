import { useState } from "react";
import { lecturerAPI } from "../../services/api";
import { useToast } from "../../context/ToastContext";

const EMPTY_FORM = {
  lecturerCode: "",
  fullName: "",
  department: "",
  email: "",
  phone: "",
  password: "",
  isActive: true,
};

const LecturerModal = ({ mode, lecturer, onClose, onSuccess }) => {
  const toast  = useToast();
  const isEdit = mode === "edit";

  const [form, setForm] = useState(
    isEdit
      ? {
          lecturerCode: lecturer.LecturerCode,
          fullName:     lecturer.FullName,
          department:   lecturer.Department || "",
          email:        lecturer.Email      || "",
          phone:        lecturer.Phone      || "",
          password:     "",
          isActive:     !!lecturer.IsActive,
        }
      : { ...EMPTY_FORM }
  );

  const [errors,     setErrors]     = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const errs = {};
    if (!form.fullName.trim())     errs.fullName     = "Họ tên là bắt buộc.";
    if (!isEdit) {
      if (!form.lecturerCode.trim()) errs.lecturerCode = "Mã giảng viên là bắt buộc.";
      if (!form.password)            errs.password     = "Mật khẩu là bắt buộc.";
      else if (form.password.length < 6) errs.password = "Mật khẩu tối thiểu 6 ký tự.";
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = "Email không hợp lệ.";
    }
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    try {
      setSubmitting(true);
      if (isEdit) {
        await lecturerAPI.update(lecturer.LecturerId, {
          fullName:   form.fullName.trim(),
          department: form.department.trim() || null,
          email:      form.email.trim()      || null,
          phone:      form.phone.trim()      || null,
          isActive:   form.isActive,
        });
        toast.success("Cập nhật giảng viên thành công!");
      } else {
        await lecturerAPI.create({
          lecturerCode: form.lecturerCode.trim(),
          fullName:     form.fullName.trim(),
          department:   form.department.trim() || null,
          email:        form.email.trim()      || null,
          phone:        form.phone.trim()      || null,
          password:     form.password,
        });
        toast.success("Thêm giảng viên thành công!");
      }
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || "Có lỗi xảy ra.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <span className="modal-icon">{isEdit ? <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg> : <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>}</span>
            <div>
              <h2 className="modal-title">{isEdit ? "Chỉnh sửa Giảng viên" : "Thêm Giảng viên"}</h2>
              <p className="modal-subtitle">
                {isEdit ? `Cập nhật thông tin cho ${lecturer.FullName}` : "Tạo tài khoản giảng viên mới"}
              </p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="modal-body">
          {/* Lecturer Code (add only) */}
          {!isEdit && (
            <div className="form-group">
              <label className="form-label">Mã Giảng viên <span className="required">*</span></label>
              <input
                className={`form-input form-input-no-icon ${errors.lecturerCode ? "error" : ""}`}
                name="lecturerCode"
                value={form.lecturerCode}
                onChange={handleChange}
                placeholder="VD: GV001"
                autoFocus
              />
              {errors.lecturerCode && <p className="form-error">⚠ {errors.lecturerCode}</p>}
              <p className="form-hint">Mã này sẽ là tên đăng nhập của giảng viên.</p>
            </div>
          )}

          {/* Full Name */}
          <div className="form-group">
            <label className="form-label">Họ và tên <span className="required">*</span></label>
            <input
              className={`form-input form-input-no-icon ${errors.fullName ? "error" : ""}`}
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              placeholder="VD: Nguyễn Văn A"
            />
            {errors.fullName && <p className="form-error">⚠ {errors.fullName}</p>}
          </div>

          {/* Department */}
          <div className="form-group">
            <label className="form-label">Khoa / Bộ môn</label>
            <input
              className="form-input form-input-no-icon"
              name="department"
              value={form.department}
              onChange={handleChange}
              placeholder="VD: Công nghệ Thông tin"
            />
          </div>

          {/* Email + Phone (2 cols) */}
          <div className="modal-row-2">
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                className={`form-input form-input-no-icon ${errors.email ? "error" : ""}`}
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="gv@university.edu.vn"
              />
              {errors.email && <p className="form-error">⚠ {errors.email}</p>}
            </div>
            <div className="form-group">
              <label className="form-label">Điện thoại</label>
              <input
                className="form-input form-input-no-icon"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="0912345678"
              />
            </div>
          </div>

          {/* Password (add only) */}
          {!isEdit && (
            <div className="form-group">
              <label className="form-label">Mật khẩu <span className="required">*</span></label>
              <input
                className={`form-input form-input-no-icon ${errors.password ? "error" : ""}`}
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Tối thiểu 6 ký tự"
              />
              {errors.password && <p className="form-error">⚠ {errors.password}</p>}
            </div>
          )}

          {/* IsActive (edit only) */}
          {isEdit && (
            <div className="form-group">
              <label className="lm-checkbox-label">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={form.isActive}
                  onChange={handleChange}
                  className="lm-checkbox"
                />
                <span>Tài khoản đang hoạt động</span>
              </label>
            </div>
          )}

          {/* Footer buttons */}
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>
              Hủy
            </button>
            <button type="submit" className="btn-primary-sm" disabled={submitting}>
              {submitting
                ? <><span className="spinner"></span> Đang lưu...</>
                : isEdit ? "Lưu thay đổi" : "Tạo giảng viên"
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LecturerModal;
