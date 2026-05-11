import { useState } from "react";

const DeleteConfirmModal = ({ lecturer, onClose, onConfirm }) => {
  const [deleting, setDeleting] = useState(false);

  const handleConfirm = async () => {
    setDeleting(true);
    await onConfirm();
    setDeleting(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box modal-sm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <span className="modal-icon danger"><svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></span>
            <div>
              <h2 className="modal-title">Xác nhận xóa</h2>
              <p className="modal-subtitle">Hành động này không thể hoàn tác</p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="delete-info-box">
            <p>Bạn có chắc muốn xóa giảng viên này?</p>
            <div className="delete-lecturer-card">
              <div className="lm-avatar lg">{lecturer.FullName.charAt(0)}</div>
              <div>
                <strong>{lecturer.FullName}</strong>
                <span>{lecturer.LecturerCode}</span>
                {lecturer.Department && <span>{lecturer.Department}</span>}
              </div>
            </div>
            <p className="delete-warning">
              <svg className="w-4 h-4 inline-block mr-1 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg> Tài khoản đăng nhập của giảng viên cũng sẽ bị xóa hoàn toàn.
            </p>
          </div>

          <div className="modal-footer">
            <button className="btn-secondary" onClick={onClose} disabled={deleting}>
              Hủy
            </button>
            <button className="btn-danger" onClick={handleConfirm} disabled={deleting}>
              {deleting ? <><span className="spinner"></span> Đang xóa...</> : "Xóa giảng viên"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
