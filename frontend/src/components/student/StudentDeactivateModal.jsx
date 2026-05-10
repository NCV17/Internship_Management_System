import { useState } from "react";

const StudentDeactivateModal = ({ student, onClose, onConfirm }) => {
  const [processing, setProcessing] = useState(false);

  const handleConfirm = async () => {
    setProcessing(true);
    await onConfirm();
    setProcessing(false);
  };

  const isActive = student.IsActive === 1 || student.IsActive === true;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box modal-sm" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <span className="modal-icon danger">
              <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </span>
            <div>
              <h2 className="modal-title">{isActive ? "Vô hiệu hóa tài khoản" : "Kích hoạt tài khoản"}</h2>
              <p className="modal-subtitle">Hành động này có thể hoàn tác được</p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="delete-info-box">
            <p>Bạn có chắc muốn <strong>{isActive ? "vô hiệu hóa" : "kích hoạt lại"}</strong> tài khoản sinh viên này?</p>
            <div className="delete-lecturer-card">
              <div className="lm-avatar lg">{student.FullName.charAt(0)}</div>
              <div>
                <strong>{student.FullName}</strong>
                <span>{student.StudentCode}</span>
                {student.ClassName && <span>{student.ClassName}</span>}
              </div>
            </div>
            {isActive && (
              <p className="delete-warning">
                <svg className="w-4 h-4 inline-block mr-1 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Sinh viên sẽ không thể đăng nhập vào hệ thống cho đến khi được kích hoạt lại.
              </p>
            )}
          </div>

          <div className="modal-footer">
            <button className="btn-secondary" onClick={onClose} disabled={processing}>
              Hủy
            </button>
            <button className={isActive ? "btn-danger" : "btn-primary-sm"} onClick={handleConfirm} disabled={processing}>
              {processing
                ? <><span className="spinner"></span> Đang xử lý...</>
                : isActive ? "Vô hiệu hóa" : "Kích hoạt"
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDeactivateModal;
