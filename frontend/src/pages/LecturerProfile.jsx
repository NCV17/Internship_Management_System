import React, { useState, useEffect } from "react";
import { User, Lock, Mail, Phone, BookOpen, Clock } from "lucide-react";
import { lecturerProfileAPI } from "../services/api";
import { useToast } from "../context/ToastContext";

const LecturerProfile = () => {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  
  // Edit Personal Info state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    email: "",
    phone: ""
  });

  // Change Password state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [passLoading, setPassLoading] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await lecturerProfileAPI.getProfile();
      if (res.data.success) {
        const data = res.data.data;
        setProfile(data.profile);
        setStats(data.stats);
        setEditForm({
          email: data.profile.Email || "",
          phone: data.profile.Phone || ""
        });
      }
    } catch (error) {
      toast.error("Không thể tải thông tin hồ sơ");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // Revert if cancelled
      setEditForm({
        email: profile.Email || "",
        phone: profile.Phone || ""
      });
    }
    setIsEditing(!isEditing);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const res = await lecturerProfileAPI.updateProfile(editForm);
      if (res.data.success) {
        toast.success("Cập nhật thông tin thành công");
        setProfile({ ...profile, ...editForm });
        setIsEditing(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Cập nhật thất bại");
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error("Mật khẩu mới phải có ít nhất 6 ký tự");
      return;
    }

    try {
      setPassLoading(true);
      const res = await lecturerProfileAPI.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      if (res.data.success) {
        toast.success("Đổi mật khẩu thành công");
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Đổi mật khẩu thất bại");
    } finally {
      setPassLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="spinner"></div>
      </div>
    );
  }

  const initials = profile?.FullName?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <>
      <div className="topbar">
        <div>
          <div className="topbar-title">Hồ sơ cá nhân</div>
          <div className="topbar-subtitle">Quản lý thông tin cá nhân và bảo mật tài khoản</div>
        </div>
        <span className="role-badge lecturer">GIẢNG VIÊN</span>
      </div>

      <div className="page-content">
        {/* STATS */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon blue">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div className="stat-info">
              <div className="stat-number">{stats?.assignedStudents || 0}</div>
              <div className="stat-label">Sinh viên hướng dẫn</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon green">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="stat-info">
              <div className="stat-number">{stats?.approvedReports || 0}</div>
              <div className="stat-label">Báo cáo đã duyệt</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon purple">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="stat-info">
              <div className="stat-number">{stats?.completedEvaluations || 0}</div>
              <div className="stat-label">Đã hoàn thành đánh giá</div>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "28px" }}>
          
          {/* LEFT COLUMN */}
          <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
            
            {/* AVATAR & QUICK INFO */}
            <div style={{ background: "var(--bg-card)", borderRadius: "var(--radius)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)", overflow: "hidden", padding: "32px 24px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ width: "96px", height: "96px", borderRadius: "50%", background: "var(--sidebar-active)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "36px", fontWeight: "700", marginBottom: "16px", border: "4px solid #fff", boxShadow: "0 4px 10px rgba(0,0,0,0.05)" }}>
                {initials}
              </div>
              <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 4px 0", color: "var(--text-primary)" }}>{profile?.FullName}</h2>
              <div style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "16px", display: "flex", alignItems: "center", gap: "6px" }}>
                <User size={14} /> MSGV: {profile?.LecturerCode}
              </div>
              
              <div style={{ display: "flex", gap: "8px", justifyContent: "center", marginBottom: "20px" }}>
                <span className={`role-badge ${profile?.IsActive ? 'student' : 'admin'}`} style={{ textTransform: "none" }}>
                  {profile?.IsActive ? 'Đang hoạt động' : 'Ngưng hoạt động'}
                </span>
              </div>
              
              <div style={{ width: "100%", height: "1px", background: "var(--border)", margin: "0 0 20px 0" }}></div>
              
              <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "12px", textAlign: "left", fontSize: "13.5px", color: "var(--text-secondary)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <BookOpen size={16} style={{ color: "var(--text-muted)" }} />
                  <span>{profile?.Department || "Chưa cập nhật"}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Mail size={16} style={{ color: "var(--text-muted)" }} />
                  <span style={{ wordBreak: "break-all" }}>{profile?.Email || "Chưa cập nhật"}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Phone size={16} style={{ color: "var(--text-muted)" }} />
                  <span>{profile?.Phone || "Chưa cập nhật"}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Clock size={16} style={{ color: "var(--text-muted)" }} />
                  <span>Tham gia: {profile?.CreatedAt ? new Date(profile.CreatedAt).toLocaleDateString('vi-VN') : "N/A"}</span>
                </div>
              </div>
            </div>

            {/* CHANGE PASSWORD */}
            <div style={{ background: "var(--bg-card)", borderRadius: "var(--radius)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)", overflow: "hidden" }}>
              <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--border)" }}>
                <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                  <Lock size={18} style={{ color: "var(--error)" }} /> Bảo mật tài khoản
                </h3>
              </div>
              <div style={{ padding: "24px" }}>
                <form onSubmit={handleChangePassword}>
                  <div className="form-group">
                    <label className="form-label">Mật khẩu hiện tại</label>
                    <input 
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                      className="form-input form-input-no-icon"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Mật khẩu mới</label>
                    <input 
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                      className="form-input form-input-no-icon"
                      placeholder="Tối thiểu 6 ký tự"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Xác nhận mật khẩu mới</label>
                    <input 
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                      className="form-input form-input-no-icon"
                      placeholder="Nhập lại mật khẩu mới"
                      required
                    />
                  </div>
                  <button type="submit" className="btn-primary" disabled={passLoading} style={{ marginTop: "24px" }}>
                    {passLoading ? <div className="spinner"></div> : "Cập nhật mật khẩu"}
                  </button>
                </form>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN */}
          <div>
            <div style={{ background: "var(--bg-card)", borderRadius: "var(--radius)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)", overflow: "hidden" }}>
              <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                  <User size={18} style={{ color: "var(--primary)" }} /> Thông tin chi tiết
                </h3>
                <button 
                  onClick={handleEditToggle}
                  style={{ 
                    background: isEditing ? "var(--sidebar-hover)" : "var(--sidebar-active)",
                    color: isEditing ? "var(--text-secondary)" : "var(--primary)",
                    border: "none",
                    padding: "6px 14px",
                    borderRadius: "var(--radius-sm)",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    transition: "all 0.2s"
                  }}
                >
                  {isEditing ? "Hủy chỉnh sửa" : "Chỉnh sửa"}
                </button>
              </div>
              
              <div style={{ padding: "24px" }}>
                <form onSubmit={handleUpdateProfile}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                    
                    {/* Read-only fields */}
                    <div className="form-group">
                      <label className="form-label" style={{ color: "var(--text-muted)" }}>Họ và tên</label>
                      <div style={{ padding: "10px 14px", background: "var(--bg-page)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", fontSize: "14px", fontWeight: 600, color: "var(--text-secondary)" }}>
                        {profile?.FullName}
                      </div>
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label" style={{ color: "var(--text-muted)" }}>Mã giảng viên</label>
                      <div style={{ padding: "10px 14px", background: "var(--bg-page)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", fontSize: "14px", fontWeight: 600, color: "var(--text-secondary)" }}>
                        {profile?.LecturerCode}
                      </div>
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label" style={{ color: "var(--text-muted)" }}>Khoa / Bộ môn</label>
                      <div style={{ padding: "10px 14px", background: "var(--bg-page)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", fontSize: "14px", fontWeight: 600, color: "var(--text-secondary)" }}>
                        {profile?.Department || "N/A"}
                      </div>
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label" style={{ color: "var(--text-muted)" }}>Ngày tham gia</label>
                      <div style={{ padding: "10px 14px", background: "var(--bg-page)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", fontSize: "14px", fontWeight: 600, color: "var(--text-secondary)" }}>
                        {profile?.CreatedAt ? new Date(profile.CreatedAt).toLocaleDateString('vi-VN') : "N/A"}
                      </div>
                    </div>

                    {/* Editable fields */}
                    <div className="form-group">
                      <label className="form-label">Địa chỉ Email</label>
                      {isEditing ? (
                        <input 
                          type="email" 
                          value={editForm.email}
                          onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                          className="form-input form-input-no-icon"
                          required
                        />
                      ) : (
                        <div style={{ padding: "10px 14px", border: "1.5px solid transparent", fontSize: "14px", color: "var(--text-primary)" }}>
                          {profile?.Email || <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>Chưa cập nhật</span>}
                        </div>
                      )}
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Số điện thoại</label>
                      {isEditing ? (
                        <input 
                          type="tel" 
                          value={editForm.phone}
                          onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                          className="form-input form-input-no-icon"
                        />
                      ) : (
                        <div style={{ padding: "10px 14px", border: "1.5px solid transparent", fontSize: "14px", color: "var(--text-primary)" }}>
                          {profile?.Phone || <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>Chưa cập nhật</span>}
                        </div>
                      )}
                    </div>
                  </div>

                  {isEditing && (
                    <div style={{ marginTop: "24px", paddingTop: "24px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "flex-end" }}>
                      <button type="submit" className="btn-primary" style={{ width: "auto", padding: "10px 24px" }}>
                        Lưu thông tin
                      </button>
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default LecturerProfile;
