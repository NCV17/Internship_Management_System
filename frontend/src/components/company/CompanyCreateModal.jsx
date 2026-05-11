import { useState } from "react";
import { companyAPI } from "../../services/api";
import { useToast } from "../../context/ToastContext";

const CompanyCreateModal = ({ onClose, onSuccess }) => {
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    companyName: "",
    address: "",
    field: "",
    contactPerson: "",
    contactEmail: "",
    contactPhone: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.companyName.trim()) {
      toast.error("Tên công ty là bắt buộc.");
      return;
    }

    try {
      setLoading(true);
      await companyAPI.create(formData);
      toast.success("Thêm công ty thành công!");
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || "Thêm công ty thất bại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: "600px" }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <span className="modal-icon">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </span>
            <div>
              <h2 className="modal-title">Thêm công ty thực tập</h2>
              <p className="modal-subtitle">Tạo hồ sơ đối tác doanh nghiệp</p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose} disabled={loading}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label className="form-label">
              Tên công ty <span className="required">*</span>
            </label>
            <input
              type="text"
              name="companyName"
              className="form-input form-input-no-icon"
              value={formData.companyName}
              onChange={handleChange}
              placeholder="VD: FPT Software"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Địa chỉ</label>
            <input
              type="text"
              name="address"
              className="form-input form-input-no-icon"
              value={formData.address}
              onChange={handleChange}
              placeholder="VD: Khu Công Nghệ Cao, Q9"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Lĩnh vực hoạt động</label>
            <input
              type="text"
              name="field"
              className="form-input form-input-no-icon"
              value={formData.field}
              onChange={handleChange}
              placeholder="VD: Phát triển phần mềm"
            />
          </div>

          <div className="detail-section-title mt-4">Thông tin liên hệ</div>

          <div className="form-group">
            <label className="form-label">Người liên hệ</label>
            <input
              type="text"
              name="contactPerson"
              className="form-input form-input-no-icon"
              value={formData.contactPerson}
              onChange={handleChange}
              placeholder="VD: Nguyễn Văn B (HR)"
            />
          </div>

          <div className="modal-row-2">
            <div className="form-group">
              <label className="form-label">Email liên hệ</label>
              <input
                type="email"
                name="contactEmail"
                className="form-input form-input-no-icon"
                value={formData.contactEmail}
                onChange={handleChange}
                placeholder="VD: hr@fpt.com"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Số điện thoại</label>
              <input
                type="text"
                name="contactPhone"
                className="form-input form-input-no-icon"
                value={formData.contactPhone}
                onChange={handleChange}
                placeholder="VD: 0987654321"
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
              Hủy
            </button>
            <button type="submit" className="btn-primary-sm" disabled={loading}>
              {loading ? <><span className="spinner"></span> Đang xử lý...</> : "Thêm công ty"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CompanyCreateModal;
