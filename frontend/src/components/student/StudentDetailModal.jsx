const STATUS_MAP = {
  NOT_STARTED: { label: "Chưa bắt đầu", cls: "status-not-started" },
  IN_PROGRESS:  { label: "Đang thực tập", cls: "status-in-progress" },
  COMPLETED:    { label: "Hoàn thành",    cls: "status-completed" },
};

const StudentDetailModal = ({ student, onClose, onEdit }) => {
  const createdAt = student.CreatedAt
    ? new Date(student.CreatedAt).toLocaleDateString("vi-VN", {
        day: "2-digit", month: "2-digit", year: "numeric",
      })
    : "—";

  const status    = STATUS_MAP[student.InternshipStatus] || STATUS_MAP["NOT_STARTED"];
  const isActive  = student.IsActive === 1 || student.IsActive === true;

  const Row = ({ label, value }) => (
    <div className="detail-row">
      <span className="detail-label">{label}</span>
      <span className="detail-value">{value || <span className="lm-na">Chưa cập nhật</span>}</span>
    </div>
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <span className="modal-icon">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </span>
            <div>
              <h2 className="modal-title">Chi tiết Sinh viên</h2>
              <p className="modal-subtitle">Thông tin đầy đủ của sinh viên</p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {/* Avatar Header */}
          <div className="detail-header-card">
            <div className="lm-avatar xl">{student.FullName.charAt(0)}</div>
            <div>
              <h3 className="detail-name">{student.FullName}</h3>
              <span className="lm-code-badge">{student.StudentCode}</span>
              <span className={`lm-status ${isActive ? "active" : "inactive"} ml`}>
                {isActive ? "● Hoạt động" : "● Vô hiệu"}
              </span>
              <div style={{ marginTop: 6 }}>
                <span className={`sm-status-badge ${status.cls}`}>{status.label}</span>
              </div>
            </div>
          </div>

          {/* Academic Info */}
          <div className="detail-section">
            <h4 className="detail-section-title">Thông tin học vụ</h4>
            <Row label="Lớp"       value={student.ClassName} />
            <Row label="GPA"       value={student.GPA !== null && student.GPA !== undefined ? String(student.GPA) : null} />
            <Row label="Ngày tạo"  value={createdAt} />
          </div>

          {/* Contact Info */}
          <div className="detail-section">
            <h4 className="detail-section-title">Thông tin liên hệ</h4>
            <Row label="Email"       value={student.Email} />
            <Row label="Điện thoại" value={student.Phone} />
          </div>

          {/* Internship Info */}
          <div className="detail-section">
            <h4 className="detail-section-title">Thông tin thực tập</h4>
            <Row label="Đợt thực tập"         value={student.PeriodName ? `${student.PeriodName} (${student.Semester}-${student.AcademicYear})` : null} />
            <Row label="Công ty thực tập"     value={student.CompanyName} />
            <Row label="Giảng viên hướng dẫn" value={student.LecturerName ? `${student.LecturerName} (${student.LecturerCode})` : null} />
            <Row label="Khoa GV"              value={student.LecturerDepartment} />
            <Row label="Ngày phân công"       value={student.AssignedDate ? new Date(student.AssignedDate).toLocaleDateString("vi-VN") : null} />
          </div>

          {/* System Info */}
          <div className="detail-section">
            <h4 className="detail-section-title">Tài khoản hệ thống</h4>
            <Row label="Tên đăng nhập" value={student.Username} />
          </div>

          <div className="modal-footer">
            <button className="btn-secondary" onClick={onClose}>Đóng</button>
            <button className="btn-primary-sm" onClick={onEdit}>
              <svg className="w-4 h-4 mr-1 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Chỉnh sửa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDetailModal;
