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
              <p className="form-error"><svg className="w-4 h-4 inline-block mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>{errors.username}</p>
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
                {showPassword ? <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg> : <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
              </button>
            </div>
            {errors.password && (
              <p className="form-error"><svg className="w-4 h-4 inline-block mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>{errors.password}</p>
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
              <svg className="w-4 h-4 inline-block mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> {errors.general}
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
