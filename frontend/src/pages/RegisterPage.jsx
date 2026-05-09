import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    studentCode: "",
    fullName: "",
    className: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const validate = () => {
    const errs = {};
    if (!formData.studentCode.trim())
      errs.studentCode = "Vui lòng nhập mã số sinh viên (MSSV).";
    if (!formData.fullName.trim()) errs.fullName = "Vui lòng nhập họ tên.";
    if (!formData.className.trim()) errs.className = "Vui lòng nhập tên lớp.";
    if (!formData.email.trim()) {
      errs.email = "Vui lòng nhập email.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errs.email = "Địa chỉ email không hợp lệ.";
    }
    if (!formData.password) {
      errs.password = "Vui lòng nhập mật khẩu.";
    } else if (formData.password.length < 6) {
      errs.password = "Mật khẩu phải có ít nhất 6 ký tự.";
    }
    if (!formData.confirmPassword) {
      errs.confirmPassword = "Vui lòng xác nhận mật khẩu.";
    } else if (formData.password !== formData.confirmPassword) {
      errs.confirmPassword = "Mật khẩu xác nhận không khớp.";
    }
    return errs;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    try {
      const { studentCode, fullName, className, email, phone, password } =
        formData;
      await register({ studentCode, fullName, className, email, phone, password });

      toast.success("Đăng ký thành công! Bạn có thể đăng nhập ngay bây giờ.");
      navigate("/login", { replace: true });
    } catch (err) {
      const msg =
        err.response?.data?.message || "Đăng ký thất bại. Vui lòng thử lại.";
      toast.error(msg);
      setErrors({ general: msg });
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ id, label, type = "text", name, placeholder, autoComplete }) => (
    <div className="form-group">
      <label className="form-label" htmlFor={id}>
        {label}
      </label>
      <div className="form-input-wrapper">
        <input
          id={id}
          name={name}
          type={type}
          autoComplete={autoComplete || name}
          placeholder={placeholder}
          value={formData[name]}
          onChange={handleChange}
          className={`form-input ${errors[name] ? "error" : ""}`}
        />
      </div>
      {errors[name] && <p className="form-error">⚠ {errors[name]}</p>}
    </div>
  );

  return (
    <div className="auth-page">
      <div className="auth-card auth-card-wide">
        {/* LOGO */}
        <div className="auth-logo">
          <div className="auth-logo-text">
            <h1>InternshipMS</h1>
            <span>Đăng ký tài khoản Sinh Viên</span>
          </div>
        </div>

        <div className="auth-divider" />

        <h2 className="auth-title">Tạo Tài Khoản Mới</h2>
        <p className="auth-subtitle">
          Điền thông tin của bạn để đăng ký. Mã số sinh viên (MSSV) sẽ được dùng làm tài khoản đăng nhập.
        </p>

        <form onSubmit={handleSubmit} noValidate>
          {/* ROW: Student Code + Full Name */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
            <div className="form-group">
              <label className="form-label" htmlFor="studentCode">Mã số sinh viên (MSSV) *</label>
              <div className="form-input-wrapper">
                <input
                  id="studentCode"
                  name="studentCode"
                  type="text"
                  placeholder="VD: 2021001234"
                  value={formData.studentCode}
                  onChange={handleChange}
                  className={`form-input ${errors.studentCode ? "error" : ""}`}
                />
              </div>
              {errors.studentCode && <p className="form-error">⚠ {errors.studentCode}</p>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="fullName">Họ và tên *</label>
              <div className="form-input-wrapper">
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  placeholder="Nguyễn Văn A"
                  value={formData.fullName}
                  onChange={handleChange}
                  className={`form-input ${errors.fullName ? "error" : ""}`}
                />
              </div>
              {errors.fullName && <p className="form-error">⚠ {errors.fullName}</p>}
            </div>
          </div>

          {/* ROW: Class + Email */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
            <div className="form-group">
              <label className="form-label" htmlFor="className">Lớp *</label>
              <div className="form-input-wrapper">
                <input
                  id="className"
                  name="className"
                  type="text"
                  placeholder="VD: CNTT2021A"
                  value={formData.className}
                  onChange={handleChange}
                  className={`form-input ${errors.className ? "error" : ""}`}
                />
              </div>
              {errors.className && <p className="form-error">⚠ {errors.className}</p>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="email">Email *</label>
              <div className="form-input-wrapper">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="example@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  className={`form-input ${errors.email ? "error" : ""}`}
                />
              </div>
              {errors.email && <p className="form-error">⚠ {errors.email}</p>}
            </div>
          </div>

          {/* Phone */}
          <div className="form-group">
            <label className="form-label" htmlFor="phone">Số điện thoại</label>
            <div className="form-input-wrapper">
              <input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                placeholder="0912345678 (tùy chọn)"
                value={formData.phone}
                onChange={handleChange}
                className={`form-input ${errors.phone ? "error" : ""}`}
              />
            </div>
            {errors.phone && <p className="form-error">⚠ {errors.phone}</p>}
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Mật khẩu *
            </label>
            <div className="form-input-wrapper">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Ít nhất 6 ký tự"
                value={formData.password}
                onChange={handleChange}
                className={`form-input ${errors.password ? "error" : ""}`}
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 16,
                  color: "var(--text-muted)",
                }}
                aria-label="Ẩn/hiện mật khẩu"
              >
                {showPassword ? "🙈" : "👁"}
              </button>
            </div>
            {errors.password && <p className="form-error">⚠ {errors.password}</p>}
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="confirmPassword">
              Xác nhận mật khẩu *
            </label>
            <div className="form-input-wrapper">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Nhập lại mật khẩu của bạn"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`form-input ${errors.confirmPassword ? "error" : ""}`}
                style={{ paddingRight: 44 }}
              />
            </div>
            {errors.confirmPassword && (
              <p className="form-error">⚠ {errors.confirmPassword}</p>
            )}
          </div>

          {/* General Error */}
          {errors.general && (
            <div
              style={{
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: "var(--radius-sm)",
                padding: "10px 14px",
                color: "#991b1b",
                fontSize: 13,
                marginBottom: 16,
              }}
            >
              ❌ {errors.general}
            </div>
          )}

          {/* Note */}
          <div
            style={{
              background: "#fffbeb",
              border: "1px solid #fde68a",
              borderRadius: "var(--radius-sm)",
              padding: "10px 14px",
              fontSize: 12,
              color: "#92400e",
              marginBottom: 18,
            }}
          >
            ⚠️ <strong>Mã số sinh viên (MSSV)</strong> của bạn sẽ được sử dụng làm tên tài khoản đăng nhập.
          </div>

          {/* SUBMIT */}
          <button
            id="btn-register"
            type="submit"
            className="btn-primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner" />
                Đang tạo tài khoản...
              </>
            ) : (
              "Tạo Tài Khoản →"
            )}
          </button>
        </form>

        <p className="auth-footer-text">
          Đã có tài khoản?{" "}
          <Link to="/login" className="auth-link">
            Đăng nhập tại đây
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
