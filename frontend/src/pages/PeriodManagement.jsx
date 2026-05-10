import { useState, useEffect, useCallback } from "react";
import { periodAPI } from "../services/api";
import { useToast } from "../context/ToastContext";
import PeriodCreateModal from "../components/period/PeriodCreateModal";
import PeriodEditModal from "../components/period/PeriodEditModal";
import PeriodDetailModal from "../components/period/PeriodDetailModal";

const STATUS_MAP = {
  UPCOMING: { label: "Sắp diễn ra", cls: "bg-blue-100 text-blue-800" },
  ACTIVE: { label: "Đang diễn ra", cls: "bg-green-100 text-green-800" },
  CLOSED: { label: "Đã đóng", cls: "bg-gray-100 text-gray-800" },
};

const DEFAULT_FILTERS = { search: "", semester: "", academicYear: "", status: "" };

const PeriodManagement = () => {
  const toast = useToast();
  
  const [periods, setPeriods] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [searchInput, setSearchInput] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState(null);

  const fetchPeriods = useCallback(async (page = 1, activeFilters = filters) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: pagination.limit,
        ...Object.fromEntries(Object.entries(activeFilters).filter(([, v]) => v !== ""))
      };
      const res = await periodAPI.getAll(params);
      setPeriods(res.data.data.periods);
      setPagination(res.data.data.pagination);
    } catch (err) {
      toast.error(err.response?.data?.message || "Không thể tải danh sách đợt thực tập.");
    } finally {
      setLoading(false);
    }
  }, [pagination.limit, filters]);

  useEffect(() => { fetchPeriods(1, DEFAULT_FILTERS); }, []);

  const handleSearch = () => {
    const newFilters = { ...filters, search: searchInput };
    setFilters(newFilters);
    fetchPeriods(1, newFilters);
  };

  const handleSearchKeyDown = (e) => { if (e.key === "Enter") handleSearch(); };

  const handleClearSearch = () => {
    setSearchInput("");
    const newFilters = { ...filters, search: "" };
    setFilters(newFilters);
    fetchPeriods(1, newFilters);
  };

  const handleFilterChange = (name, value) => {
    const newFilters = { ...filters, [name]: value };
    setFilters(newFilters);
    fetchPeriods(1, newFilters);
  };

  const handleClearFilters = () => {
    setSearchInput("");
    setFilters(DEFAULT_FILTERS);
    fetchPeriods(1, DEFAULT_FILTERS);
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== "");

  const handleDelete = async () => {
    try {
      await periodAPI.delete(selectedPeriod.PeriodId);
      toast.success("Đã xóa đợt thực tập.");
      setShowDeleteConfirm(false);
      fetchPeriods(pagination.page, filters);
    } catch (err) {
      toast.error(err.response?.data?.message || "Xóa thất bại.");
      setShowDeleteConfirm(false);
    }
  };

  const goToPage = (p) => fetchPeriods(p, filters);

  const buildPageNumbers = () => {
    const { page, totalPages } = pagination;
    const pages = [];
    const delta = 2;
    for (let i = Math.max(1, page - delta); i <= Math.min(totalPages, page + delta); i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <>
      <div className="topbar">
        <div>
          <div className="topbar-title">Quản lý đợt thực tập</div>
          <div className="topbar-subtitle">Tạo và quản lý các đợt thực tập sinh viên</div>
        </div>
        <span className="role-badge admin">QUẢN TRỊ</span>
      </div>

      <div className="page-content">
        <div className="sm-filter-card">
          <div className="lm-toolbar" style={{ marginBottom: 12 }}>
            <div className="lm-search-group">
              <div className="lm-search-wrapper">
                <span className="lm-search-icon">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <input
                  className="lm-search-input"
                  type="text"
                  placeholder="Tìm theo tên đợt, năm học..."
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                />
                {searchInput && (
                  <button className="lm-clear-btn" onClick={handleClearSearch}>✕</button>
                )}
              </div>
              <button className="lm-search-btn" onClick={handleSearch}>Tìm kiếm</button>
            </div>
            {hasActiveFilters && (
              <button className="sm-clear-filter-btn" onClick={handleClearFilters}>
                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                Xóa bộ lọc
              </button>
            )}
            <div style={{ marginLeft: "auto" }}>
              <button className="lm-add-btn" onClick={() => setShowCreateModal(true)}>
                <svg className="w-4 h-4 mr-1 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Thêm đợt thực tập
              </button>
            </div>
          </div>

          <div className="sm-filter-row">
            <div className="sm-filter-group">
              <label className="sm-filter-label">Học kỳ</label>
              <select className="sm-filter-select" value={filters.semester} onChange={e => handleFilterChange("semester", e.target.value)}>
                <option value="">Tất cả</option>
                <option value="Học kỳ 1">Học kỳ 1</option>
                <option value="Học kỳ 2">Học kỳ 2</option>
                <option value="Học kỳ hè">Học kỳ hè</option>
              </select>
            </div>

            <div className="sm-filter-group">
              <label className="sm-filter-label">Năm học</label>
              <input type="text" className="sm-filter-select" placeholder="VD: 2023-2024" value={filters.academicYear} onChange={e => handleFilterChange("academicYear", e.target.value)} />
            </div>

            <div className="sm-filter-group">
              <label className="sm-filter-label">Trạng thái</label>
              <select className="sm-filter-select" value={filters.status} onChange={e => handleFilterChange("status", e.target.value)}>
                <option value="">Tất cả</option>
                <option value="UPCOMING">Sắp diễn ra</option>
                <option value="ACTIVE">Đang diễn ra</option>
                <option value="CLOSED">Đã đóng</option>
              </select>
            </div>
          </div>
        </div>

        <div className="lm-table-card">
          {loading ? (
            <div className="lm-empty-state">
              <div className="spinner-blue"></div>
              <p>Đang tải dữ liệu...</p>
            </div>
          ) : periods.length === 0 ? (
            <div className="lm-empty-state">
              <p style={{ fontWeight: 600 }}>Không tìm thấy đợt thực tập</p>
            </div>
          ) : (
            <div className="lm-table-wrapper">
              <table className="lm-table">
                <thead>
                  <tr>
                    <th>STT</th>
                    <th>Tên đợt</th>
                    <th>Học kỳ</th>
                    <th>Năm học</th>
                    <th>Thời gian</th>
                    <th>Trạng thái</th>
                    <th>Ngày tạo</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {periods.map((p, i) => {
                    const status = STATUS_MAP[p.Status] || STATUS_MAP["UPCOMING"];
                    return (
                      <tr key={p.PeriodId} className="lm-table-row">
                        <td className="lm-td-num">{(pagination.page - 1) * pagination.limit + i + 1}</td>
                        <td style={{ fontWeight: 500 }}>{p.PeriodName}</td>
                        <td>{p.Semester}</td>
                        <td>{p.AcademicYear}</td>
                        <td>
                          {new Date(p.StartDate).toLocaleDateString("vi-VN")} - {new Date(p.EndDate).toLocaleDateString("vi-VN")}
                        </td>
                        <td>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.cls}`}>
                            {status.label}
                          </span>
                        </td>
                        <td>{new Date(p.CreatedAt).toLocaleDateString("vi-VN")}</td>
                        <td>
                          <div className="lm-action-group">
                            <button className="lm-btn-detail" onClick={() => { setSelectedPeriod(p); setShowDetailModal(true); }} title="Chi tiết & Thống kê">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            </button>
                            <button className="lm-btn-edit" onClick={() => { setSelectedPeriod(p); setShowEditModal(true); }} title="Chỉnh sửa">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            </button>
                            <button className="lm-btn-delete" onClick={() => { setSelectedPeriod(p); setShowDeleteConfirm(true); }} title="Xóa">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {pagination.totalPages > 1 && (
          <div className="lm-pagination">
            <button className="lm-page-btn" disabled={pagination.page <= 1} onClick={() => goToPage(pagination.page - 1)}>← Trước</button>
            {buildPageNumbers().map(p => (
              <button key={p} className={`lm-page-btn ${p === pagination.page ? "active" : ""}`} onClick={() => goToPage(p)}>{p}</button>
            ))}
            <button className="lm-page-btn" disabled={pagination.page >= pagination.totalPages} onClick={() => goToPage(pagination.page + 1)}>Sau →</button>
            <span className="lm-page-info">Trang {pagination.page} / {pagination.totalPages}</span>
          </div>
        )}
      </div>

      {showCreateModal && <PeriodCreateModal onClose={() => setShowCreateModal(false)} onSuccess={() => { setShowCreateModal(false); fetchPeriods(1); }} />}
      {showEditModal && selectedPeriod && <PeriodEditModal period={selectedPeriod} onClose={() => setShowEditModal(false)} onSuccess={() => { setShowEditModal(false); fetchPeriods(pagination.page); }} />}
      {showDetailModal && selectedPeriod && <PeriodDetailModal period={selectedPeriod} onClose={() => setShowDetailModal(false)} />}
      
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-box" style={{ maxWidth: "400px" }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Xác nhận xóa</h3>
              <button className="modal-close" onClick={() => setShowDeleteConfirm(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p>Bạn có chắc muốn xóa đợt <strong>{selectedPeriod?.PeriodName}</strong> không? Các đợt đã có dữ liệu đăng ký sẽ không thể xóa.</p>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowDeleteConfirm(false)}>Hủy</button>
              <button className="btn-primary bg-red-600 hover:bg-red-700 text-white" onClick={handleDelete}>Xóa đợt</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PeriodManagement;
