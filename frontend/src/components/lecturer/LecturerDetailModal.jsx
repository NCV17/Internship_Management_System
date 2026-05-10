const LecturerDetailModal = ({ lecturer, onClose, onEdit }) => {
  const createdAt = lecturer.CreatedAt
    ? new Date(lecturer.CreatedAt).toLocaleDateString("vi-VN", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      })
    : "—";

  const Row = ({ label, value }) => (
    <div className="detail-row">
      <span className="detail-label">{label}</span>
      <span className="detail-value">{value || <span className="lm-na">Chưa cập nhật</span>}</span>
    </div>
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <span className="modal-icon"><svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg></span>
            <div>
              <h2 className="modal-title">Chi tiết Giảng viên</h2>
              <p className="modal-subtitle">Thông tin đầy đủ của giảng viên</p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {/* Avatar header */}
          <div className="detail-header-card">
            <div className="lm-avatar xl">{lecturer.FullName.charAt(0)}</div>
            <div>
              <h3 className="detail-name">{lecturer.FullName}</h3>
              <span className="lm-code-badge">{lecturer.LecturerCode}</span>
              <span className={`lm-status ${lecturer.IsActive ? "active" : "inactive"} ml`}>
                {lecturer.IsActive ? "● Hoạt động" : "● Vô hiệu"}
              </span>
            </div>
          </div>

          {/* Info rows */}
          <div className="detail-section">
            <h4 className="detail-section-title">Thông tin cá nhân</h4>
            <Row label="Khoa / Bộ môn"  value={lecturer.Department} />
            <Row label="Email"           value={lecturer.Email} />
            <Row label="Điện thoại"      value={lecturer.Phone} />
          </div>

          <div className="detail-section">
            <h4 className="detail-section-title">Tài khoản hệ thống</h4>
            <Row label="Tên đăng nhập"   value={lecturer.Username} />
            <Row label="Ngày tạo"        value={createdAt} />
          </div>

          <div className="modal-footer">
            <button className="btn-secondary" onClick={onClose}>Đóng</button>
            <button className="btn-primary-sm" onClick={onEdit}>
              <svg className="w-4 h-4 mr-1 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg> Chỉnh sửa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LecturerDetailModal;
