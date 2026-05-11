import { useState, useEffect, useCallback } from "react";
import { companyAPI, periodAPI } from "../services/api";
import { useToast } from "../context/ToastContext";
import CompanyCreateModal from "../components/company/CompanyCreateModal";
import CompanyEditModal from "../components/company/CompanyEditModal";
import CompanyDetailModal from "../components/company/CompanyDetailModal";

const DEFAULT_FILTERS = { search: "", field: "", periodId: "" };

const CompanyManagement = () => {
  const toast = useToast();
  
  const [companies, setCompanies] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [searchInput, setSearchInput] = useState("");
  const [periods, setPeriods] = useState([]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);

  useEffect(() => {
    const fetchPeriods = async () => {
      try {
        const res = await periodAPI.getAll({ limit: 100 });
        setPeriods(res.data.data.periods);
      } catch (err) {
        console.error(err);
      }
    };
    fetchPeriods();
  }, []);

  const fetchCompanies = useCallback(async (page = 1, activeFilters = filters) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: pagination.limit,
        ...Object.fromEntries(Object.entries(activeFilters).filter(([, v]) => v !== ""))
      };
      const res = await companyAPI.getAll(params);
      setCompanies(res.data.data.companies);
      setPagination(res.data.data.pagination);
    } catch (err) {
      toast.error(err.response?.data?.message || "Không thể tải danh sách công ty.");
    } finally {
      setLoading(false);
    }
  }, [pagination.limit, filters]);

  useEffect(() => { fetchCompanies(1, DEFAULT_FILTERS); }, []);

  const handleSearch = () => {
    const newFilters = { ...filters, search: searchInput };
    setFilters(newFilters);
    fetchCompanies(1, newFilters);
  };

  const handleSearchKeyDown = (e) => { if (e.key === "Enter") handleSearch(); };

  const handleClearSearch = () => {
    setSearchInput("");
    const newFilters = { ...filters, search: "" };
    setFilters(newFilters);
    fetchCompanies(1, newFilters);
  };

  const handleFilterChange = (name, value) => {
    const newFilters = { ...filters, [name]: value };
    setFilters(newFilters);
    fetchCompanies(1, newFilters);
  };

  const handleClearFilters = () => {
    setSearchInput("");
    setFilters(DEFAULT_FILTERS);
    fetchCompanies(1, DEFAULT_FILTERS);
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== "");

  const handleDelete = async () => {
    try {
      await companyAPI.delete(selectedCompany.CompanyId);
      toast.success("Đã xóa công ty.");
      setShowDeleteConfirm(false);
      fetchCompanies(pagination.page, filters);
    } catch (err) {
      toast.error(err.response?.data?.message || "Xóa thất bại.");
      setShowDeleteConfirm(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      toast.info("Đang xuất file Excel...");
      const res = await companyAPI.exportExcel({
        search: filters.search,
        field: filters.field,
        periodId: filters.periodId,
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "Danh_sach_Cong_ty.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Xuất Excel thành công!");
    } catch (err) {
      toast.error("Xuất Excel thất bại.");
    }
  };

  const goToPage = (p) => fetchCompanies(p, filters);

  const buildPageNumbers = () => {
    const { page, totalPages } = pagination;
    const pages = [];
    const delta = 2;
    for (let i = Math.max(1, page - delta); i <= Math.min(totalPages, page + delta); i++) {
      pages.push(i);
    }
    return pages;
  };

  // Get unique fields for filter
  const uniqueFields = Array.from(new Set(companies.map(c => c.Field).filter(Boolean)));

  return (
    <>
      <div className="topbar">
        <div>
          <div className="topbar-title">Quản lý Công ty Thực tập</div>
          <div className="topbar-subtitle">Quản lý hồ sơ đối tác và danh sách sinh viên thực tập</div>
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
                  placeholder="Tìm theo tên công ty, người liên hệ, email..."
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
            <div style={{ display: "flex", gap: "8px", marginLeft: "auto" }}>
              <button className="btn-secondary" onClick={handleExportExcel}>
                <svg className="w-4 h-4 mr-1 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> Xuất Excel
              </button>
              <button className="lm-add-btn" onClick={() => setShowCreateModal(true)}>
                <svg className="w-4 h-4 mr-1 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Thêm Công ty
              </button>
            </div>
          </div>

          <div className="sm-filter-row">
            <div className="sm-filter-group">
              <label className="sm-filter-label">Lọc theo đợt thực tập</label>
              <select className="sm-filter-select" value={filters.periodId} onChange={e => handleFilterChange("periodId", e.target.value)}>
                <option value="">Tất cả các đợt</option>
                {periods.map(p => (
                  <option key={p.PeriodId} value={p.PeriodId}>{p.PeriodName} ({p.Semester} - {p.AcademicYear})</option>
                ))}
              </select>
            </div>

            <div className="sm-filter-group">
              <label className="sm-filter-label">Lĩnh vực</label>
              <select className="sm-filter-select" value={filters.field} onChange={e => handleFilterChange("field", e.target.value)}>
                <option value="">Tất cả</option>
                {uniqueFields.map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
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
          ) : companies.length === 0 ? (
            <div className="lm-empty-state">
              <p style={{ fontWeight: 600 }}>Không tìm thấy công ty phù hợp</p>
            </div>
          ) : (
            <div className="lm-table-wrapper">
              <table className="lm-table">
                <thead>
                  <tr>
                    <th>STT</th>
                    <th>Tên công ty</th>
                    <th>Lĩnh vực</th>
                    <th>Người liên hệ</th>
                    <th>Thông tin liên hệ</th>
                    <th className="text-center">Tổng SV</th>
                    <th className="text-center">Số đợt tham gia</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {companies.map((c, i) => (
                    <tr key={c.CompanyId} className="lm-table-row">
                      <td className="lm-td-num">{(pagination.page - 1) * pagination.limit + i + 1}</td>
                      <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>{c.CompanyName}</td>
                      <td>{c.Field || <span className="lm-na">—</span>}</td>
                      <td>{c.ContactPerson || <span className="lm-na">—</span>}</td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                          {c.ContactEmail ? <span className="text-xs text-slate-600">✉ {c.ContactEmail}</span> : <span className="lm-na">—</span>}
                          {c.ContactPhone ? <span className="text-xs text-slate-600">📞 {c.ContactPhone}</span> : null}
                        </div>
                      </td>
                      <td className="text-center">
                        <span className="inline-flex items-center justify-center px-2 py-1 bg-blue-50 text-blue-700 rounded font-semibold text-xs">
                          {c.TotalStudents} SV
                        </span>
                      </td>
                      <td className="text-center text-sm font-medium">{c.TotalPeriods}</td>
                      <td>
                        <div className="lm-action-group">
                          <button className="lm-btn-detail" onClick={() => { setSelectedCompany(c); setShowDetailModal(true); }} title="Chi tiết & Thống kê">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          </button>
                          <button className="lm-btn-edit" onClick={() => { setSelectedCompany(c); setShowEditModal(true); }} title="Chỉnh sửa">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          </button>
                          <button className="lm-btn-delete" onClick={() => { setSelectedCompany(c); setShowDeleteConfirm(true); }} title="Xóa">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
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

      {showCreateModal && <CompanyCreateModal onClose={() => setShowCreateModal(false)} onSuccess={() => { setShowCreateModal(false); fetchCompanies(1); }} />}
      {showEditModal && selectedCompany && <CompanyEditModal company={selectedCompany} onClose={() => setShowEditModal(false)} onSuccess={() => { setShowEditModal(false); fetchCompanies(pagination.page); }} />}
      {showDetailModal && selectedCompany && <CompanyDetailModal company={selectedCompany} periodId={filters.periodId} onClose={() => setShowDetailModal(false)} />}
      
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-box" style={{ maxWidth: "400px" }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Xác nhận xóa</h3>
              <button className="modal-close" onClick={() => setShowDeleteConfirm(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p>Bạn có chắc muốn xóa công ty <strong>{selectedCompany?.CompanyName}</strong> không?</p>
              <p className="text-xs text-red-600 mt-2">* Công ty đã có sinh viên đăng ký thực tập sẽ không thể bị xóa.</p>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowDeleteConfirm(false)}>Hủy</button>
              <button className="btn-primary bg-red-600 hover:bg-red-700 text-white" onClick={handleDelete}>Xóa</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CompanyManagement;
