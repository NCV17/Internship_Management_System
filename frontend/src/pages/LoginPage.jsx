import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

const LoginPage = () => {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const validate = () => {
    const errs = {};
    if (!formData.username.trim()) errs.username = "Vui lòng nhập tài khoản.";
    if (!formData.password) errs.password = "Vui lòng nhập mật khẩu.";
    else if (formData.password.length < 1) errs.password = "Mật khẩu không được để trống.";
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
      const user = await login(formData.username.trim(), formData.password);

      toast.success(`Chào mừng trở lại, ${user.fullName || user.username}!`);

      // Redirect by role
      if (user.role === "ADMIN") navigate("/admin", { replace: true });
      else if (user.role === "LECTURER") navigate("/lecturer", { replace: true });
      else if (user.role === "STUDENT") navigate("/student", { replace: true });
    } catch (err) {
      const msg =
        err.response?.data?.message || "Đăng nhập thất bại. Vui lòng thử lại.";
      toast.error(msg);
      setErrors({ general: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* LOGO */}
        <div className="auth-logo">
          <div className="auth-logo-text">
            <h1>InternshipMS</h1>
            <span>Hệ Thống Quản Lý Thực Tập</span>
          </div>
        </div>

        <div className="auth-divider" />

        <h2 className="auth-title">Đăng nhập vào hệ thống</h2>
        <p className="auth-subtitle">
          Nhập tài khoản và mật khẩu của bạn để truy cập
        </p>

        <form onSubmit={handleSubmit} noValidate>
          {/* USERNAME */}
          <div className="form-group">
            <label className="form-label" htmlFor="username">
              Tài khoản
            </label>
            <div className="form-input-wrapper">
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                placeholder="Nhập tên tài khoản"
                value={formData.username}
                onChange={handleChange}
                className={`form-input ${errors.username ? "error" : ""}`}
              />
            </div>
            {errors.username && (
              <p className="form-error">⚠ {errors.username}</p>
            )}
          </div>

          {/* PASSWORD */}
          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Mật khẩu
            </label>
            <div className="form-input-wrapper">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Nhập mật khẩu"
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
            {errors.password && (
              <p className="form-error">⚠ {errors.password}</p>
            )}
          </div>

          {/* GENERAL ERROR */}
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

          {/* SUBMIT */}
          <button
            id="btn-login"
            type="submit"
            className="btn-primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner" />
                Đang đăng nhập...
              </>
            ) : (
              "Đăng Nhập →"
            )}
          </button>
        </form>

        <p className="auth-footer-text">
          Bạn là sinh viên mới?{" "}
          <Link to="/register" className="auth-link">
            Đăng ký tại đây
          </Link>
        </p>

        {/* Role hints */}
        <div
          style={{
            marginTop: 24,
            padding: "14px 16px",
            background: "#eff6ff",
            borderRadius: "var(--radius-sm)",
            border: "1px solid #bfdbfe",
          }}
        >
          <p style={{ fontSize: 11, color: "#1e40af", fontWeight: 600, marginBottom: 6 }}>
            📌 Hướng dẫn tài khoản đăng nhập:
          </p>
          <p style={{ fontSize: 11, color: "#3b82f6", lineHeight: 1.8 }}>
            • <strong>Admin:</strong> Tài khoản = <code>admin</code>
            <br />
            • <strong>Giảng viên:</strong> Tài khoản = Mã giảng viên
            <br />
            • <strong>Sinh viên:</strong> Tài khoản = Mã số sinh viên (MSSV)
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
