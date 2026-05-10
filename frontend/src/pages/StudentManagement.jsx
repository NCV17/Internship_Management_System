import { useState, useEffect, useCallback } from "react";
import { studentAPI } from "../services/api";
import { useToast } from "../context/ToastContext";
import StudentEditModal       from "../components/student/StudentEditModal";
import StudentDeactivateModal from "../components/student/StudentDeactivateModal";
import StudentDetailModal     from "../components/student/StudentDetailModal";
import StudentCreateModal     from "../components/student/StudentCreateModal";

// ─── Status badge config ──────────────────────────────────────────────────────
const STATUS_MAP = {
  NOT_STARTED: { label: "Chưa bắt đầu", cls: "status-not-started" },
  IN_PROGRESS:  { label: "Đang thực tập", cls: "status-in-progress" },
  COMPLETED:    { label: "Hoàn thành",    cls: "status-completed" },
};

// ─── Filter default ───────────────────────────────────────────────────────────
const DEFAULT_FILTERS = {
  search:      "",
  status:      "",
  hasLecturer: "",
  hasCompany:  "",
};

const StudentManagement = () => {
  const toast = useToast();

  // Data state
  const [students,   setStudents]   = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [loading,    setLoading]    = useState(false);

  // Filter/search state
  const [filters,      setFilters]      = useState(DEFAULT_FILTERS);
  const [searchInput,  setSearchInput]  = useState("");

  // Modal state
  const [showCreateModal,     setShowCreateModal]     = useState(false);
  const [showEditModal,       setShowEditModal]       = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showDetailModal,     setShowDetailModal]     = useState(false);
  const [selectedStudent,     setSelectedStudent]     = useState(null);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchStudents = useCallback(async (page = 1, activeFilters = filters) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: pagination.limit,
        ...Object.fromEntries(
          Object.entries(activeFilters).filter(([, v]) => v !== "")
        ),
      };
      const res = await studentAPI.getAll(params);
      setStudents(res.data.data.students);
      setPagination(res.data.data.pagination);
    } catch (err) {
      toast.error(err.response?.data?.message || "Không thể tải danh sách sinh viên.");
    } finally {
      setLoading(false);
    }
  }, [pagination.limit, filters]);

  useEffect(() => { fetchStudents(1, DEFAULT_FILTERS); }, []);

  // ── Search + Filter handlers ──────────────────────────────────────────────
  const handleSearch = () => {
    const newFilters = { ...filters, search: searchInput };
    setFilters(newFilters);
    fetchStudents(1, newFilters);
  };

  const handleSearchKeyDown = (e) => { if (e.key === "Enter") handleSearch(); };

  const handleClearSearch = () => {
    setSearchInput("");
    const newFilters = { ...filters, search: "" };
    setFilters(newFilters);
    fetchStudents(1, newFilters);
  };

  const handleFilterChange = (name, value) => {
    const newFilters = { ...filters, [name]: value };
    setFilters(newFilters);
    fetchStudents(1, newFilters);
  };

  const handleClearFilters = () => {
    setSearchInput("");
    setFilters(DEFAULT_FILTERS);
    fetchStudents(1, DEFAULT_FILTERS);
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== "");

  // ── Pagination ────────────────────────────────────────────────────────────
  const goToPage = (p) => fetchStudents(p, filters);

  const buildPageNumbers = () => {
    const { page, totalPages } = pagination;
    const pages = [];
    const delta = 2;
    for (let i = Math.max(1, page - delta); i <= Math.min(totalPages, page + delta); i++) {
      pages.push(i);
    }
    return pages;
  };

  // ── Modal actions ─────────────────────────────────────────────────────────
  const openDetail     = (s) => { setSelectedStudent(s); setShowDetailModal(true); };
  const openEdit       = (s) => { setSelectedStudent(s); setShowEditModal(true); };
  const openDeactivate = (s) => { setSelectedStudent(s); setShowDeactivateModal(true); };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    fetchStudents(pagination.page, filters);
    toast.success("Đã cập nhật thông tin sinh viên.");
  };

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    fetchStudents(1, filters);
  };

  const handleExportExcel = async () => {
    try {
      toast.info("Đang xuất file Excel...");
      const res = await studentAPI.exportExcel({
        search: filters.search,
        status: filters.status,
        hasLecturer: filters.hasLecturer,
        hasCompany: filters.hasCompany,
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "Danh_sach_Sinh_vien.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Xuất Excel thành công!");
    } catch (err) {
      toast.error("Xuất Excel thất bại.");
    }
  };

  const handleDeactivateConfirm = async () => {
    try {
      const isCurrentlyActive = selectedStudent.IsActive === 1 || selectedStudent.IsActive === true;
      await studentAPI.updateAccountStatus(selectedStudent.StudentId, { isActive: !isCurrentlyActive });
      toast.success(isCurrentlyActive
        ? `Tài khoản "${selectedStudent.FullName}" đã bị vô hiệu hóa.`
        : `Tài khoản "${selectedStudent.FullName}" đã được kích hoạt lại.`
      );
      setShowDeactivateModal(false);
      fetchStudents(pagination.page, filters);
    } catch (err) {
      toast.error(err.response?.data?.message || "Thao tác thất bại.");
    }
  };

  return (
    <>
      {/* ── Top Bar ────────────────────────────────────────────────────── */}
      <div className="topbar">
        <div>
          <div className="topbar-title">Quản lý Sinh viên</div>
          <div className="topbar-subtitle">Xem, lọc và quản lý thông tin sinh viên thực tập</div>
        </div>
        <span className="role-badge admin">QUẢN TRỊ</span>
      </div>

      <div className="page-content">
        {/* ── Search & Filter Bar ────────────────────────────────────── */}
        <div className="sm-filter-card">
          {/* Row 1: Search */}
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
                  placeholder="Tìm theo MSSV, họ tên, lớp..."
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
                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Xóa bộ lọc
              </button>
            )}
            <div style={{ display: "flex", gap: "8px", marginLeft: "auto" }}>
              <button className="btn-secondary" onClick={handleExportExcel}>
                <svg className="w-4 h-4 mr-1 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> Xuất Excel
              </button>
              <button className="lm-add-btn" onClick={() => setShowCreateModal(true)}>
                <svg className="w-4 h-4 mr-1 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg> Thêm Sinh viên
              </button>
            </div>
          </div>

          {/* Row 2: Filter dropdowns */}
          <div className="sm-filter-row">
            <div className="sm-filter-group">
              <label className="sm-filter-label">Trạng thái thực tập</label>
              <select
                className="sm-filter-select"
                value={filters.status}
                onChange={e => handleFilterChange("status", e.target.value)}
              >
                <option value="">Tất cả</option>
                <option value="NOT_STARTED">Chưa bắt đầu</option>
                <option value="IN_PROGRESS">Đang thực tập</option>
                <option value="COMPLETED">Hoàn thành</option>
              </select>
            </div>

            <div className="sm-filter-group">
              <label className="sm-filter-label">Giảng viên hướng dẫn</label>
              <select
                className="sm-filter-select"
                value={filters.hasLecturer}
                onChange={e => handleFilterChange("hasLecturer", e.target.value)}
              >
                <option value="">Tất cả</option>
                <option value="yes">Đã có GV</option>
                <option value="no">Chưa có GV</option>
              </select>
            </div>

            <div className="sm-filter-group">
              <label className="sm-filter-label">Công ty thực tập</label>
              <select
                className="sm-filter-select"
                value={filters.hasCompany}
                onChange={e => handleFilterChange("hasCompany", e.target.value)}
              >
                <option value="">Tất cả</option>
                <option value="yes">Đã có công ty</option>
                <option value="no">Chưa có công ty</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── Stats strip ────────────────────────────────────────────── */}
        <div className="lm-stats-strip">
          <span>Tổng: <strong>{pagination.total}</strong> sinh viên</span>
          {filters.status      && <span className="lm-filter-tag">Trạng thái: {STATUS_MAP[filters.status]?.label}</span>}
          {filters.hasLecturer && <span className="lm-filter-tag">{filters.hasLecturer === "yes" ? "Đã có GV" : "Chưa có GV"}</span>}
          {filters.hasCompany  && <span className="lm-filter-tag">{filters.hasCompany === "yes" ? "Đã có công ty" : "Chưa có công ty"}</span>}
          {filters.search      && <span className="lm-filter-tag">"{filters.search}"</span>}
        </div>

        {/* ── Table ──────────────────────────────────────────────────── */}
        <div className="lm-table-card">
          {loading ? (
            <div className="lm-empty-state">
              <div className="spinner-blue"></div>
              <p>Đang tải dữ liệu...</p>
            </div>
          ) : students.length === 0 ? (
            <div className="lm-empty-state">
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
                <svg className="w-12 h-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <p style={{ fontWeight: 600, color: "var(--text-secondary)" }}>Không tìm thấy sinh viên</p>
              <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
                {hasActiveFilters ? "Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm." : "Chưa có sinh viên nào trong hệ thống."}
              </p>
            </div>
          ) : (
            <div className="lm-table-wrapper">
              <table className="lm-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>MSSV</th>
                    <th>Họ và tên</th>
                    <th>Lớp</th>
                    <th>Giảng viên HD</th>
                    <th>Công ty thực tập</th>
                    <th>GPA</th>
                    <th>Trạng thái TT</th>
                    <th>Tài khoản</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s, i) => {
                    const status   = STATUS_MAP[s.InternshipStatus] || STATUS_MAP["NOT_STARTED"];
                    const isActive = s.IsActive === 1 || s.IsActive === true;

                    return (
                      <tr key={s.StudentId} className="lm-table-row">
                        <td className="lm-td-num">
                          {(pagination.page - 1) * pagination.limit + i + 1}
                        </td>
                        <td>
                          <span className="lm-code-badge">{s.StudentCode}</span>
                        </td>
                        <td>
                          <div className="lm-name-cell">
                            <div className="lm-avatar">{s.FullName.charAt(0)}</div>
                            <span className="lm-name">{s.FullName}</span>
                          </div>
                        </td>
                        <td>{s.ClassName || <span className="lm-na">—</span>}</td>
                        <td>
                          {s.LecturerName
                            ? <div className="sm-lecturer-cell">
                                <span className="sm-lecturer-name">{s.LecturerName}</span>
                                <span className="sm-lecturer-dept">{s.LecturerDepartment}</span>
                              </div>
                            : <span className="sm-no-data">
                                <svg className="w-3.5 h-3.5 mr-1 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Chưa có
                              </span>
                          }
                        </td>
                        <td>
                          {s.CompanyName
                            ? <div className="sm-company-cell">
                                <span className="sm-company-name">{s.CompanyName}</span>
                              </div>
                            : <span className="sm-no-data">
                                <svg className="w-3.5 h-3.5 mr-1 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Chưa có
                              </span>
                          }
                        </td>
                        <td>
                          {s.GPA !== null && s.GPA !== undefined
                            ? <strong style={{ color: parseFloat(s.GPA) >= 3 ? "#059669" : parseFloat(s.GPA) >= 2 ? "#d97706" : "#dc2626" }}>{parseFloat(s.GPA).toFixed(2)}</strong>
                            : <span className="lm-na">—</span>
                          }
                        </td>
                        <td>
                          <span className={`sm-status-badge ${status.cls}`}>{status.label}</span>
                        </td>
                        <td>
                          <span className={`lm-status ${isActive ? "active" : "inactive"}`}>
                            {isActive ? "● Hoạt động" : "● Vô hiệu"}
                          </span>
                        </td>
                        <td>
                          <div className="lm-action-group">
                            <button className="lm-btn-detail" onClick={() => openDetail(s)} title="Chi tiết">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                            <button className="lm-btn-edit" onClick={() => openEdit(s)} title="Chỉnh sửa">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              className={isActive ? "lm-btn-delete" : "lm-btn-activate"}
                              onClick={() => openDeactivate(s)}
                              title={isActive ? "Vô hiệu hóa" : "Kích hoạt lại"}
                            >
                              {isActive
                                ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                                : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                              }
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

        {/* ── Pagination ─────────────────────────────────────────────── */}
        {pagination.totalPages > 1 && (
          <div className="lm-pagination">
            <button
              className="lm-page-btn"
              disabled={pagination.page <= 1}
              onClick={() => goToPage(pagination.page - 1)}
            >← Trước</button>

            {buildPageNumbers().map(p => (
              <button
                key={p}
                className={`lm-page-btn ${p === pagination.page ? "active" : ""}`}
                onClick={() => goToPage(p)}
              >{p}</button>
            ))}

            <button
              className="lm-page-btn"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => goToPage(pagination.page + 1)}
            >Sau →</button>

            <span className="lm-page-info">
              Trang {pagination.page} / {pagination.totalPages}
            </span>
          </div>
        )}
      </div>

      {/* ── Modals ──────────────────────────────────────────────────── */}
      {showDetailModal && selectedStudent && (
        <StudentDetailModal
          student={selectedStudent}
          onClose={() => setShowDetailModal(false)}
          onEdit={() => { setShowDetailModal(false); openEdit(selectedStudent); }}
        />
      )}
      {showEditModal && selectedStudent && (
        <StudentEditModal
          student={selectedStudent}
          onClose={() => setShowEditModal(false)}
          onSuccess={handleEditSuccess}
        />
      )}
      {showDeactivateModal && selectedStudent && (
        <StudentDeactivateModal
          student={selectedStudent}
          onClose={() => setShowDeactivateModal(false)}
          onConfirm={handleDeactivateConfirm}
        />
      )}
      {showCreateModal && (
        <StudentCreateModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />
      )}
    </>
  );
};

export default StudentManagement;
