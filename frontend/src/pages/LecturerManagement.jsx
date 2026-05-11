import { useState, useEffect, useCallback } from "react";
import { lecturerAPI } from "../services/api";
import { useToast } from "../context/ToastContext";
import LecturerModal from "../components/lecturer/LecturerModal";
import DeleteConfirmModal from "../components/lecturer/DeleteConfirmModal";
import LecturerDetailModal from "../components/lecturer/LecturerDetailModal";

const LecturerManagement = () => {
  const toast = useToast();

  const [lecturers, setLecturers]         = useState([]);
  const [pagination, setPagination]       = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [loading, setLoading]             = useState(false);
  const [search, setSearch]               = useState("");
  const [searchInput, setSearchInput]     = useState("");

  const [showAddModal, setShowAddModal]       = useState(false);
  const [showEditModal, setShowEditModal]     = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedLecturer, setSelectedLecturer] = useState(null);

  // ── Fetch lecturers ──────────────────────────────────────────────────────
  const fetchLecturers = useCallback(async (page = 1, searchTerm = search) => {
    try {
      setLoading(true);
      const res = await lecturerAPI.getAll({ page, limit: pagination.limit, search: searchTerm });
      setLecturers(res.data.data.lecturers);
      setPagination(res.data.data.pagination);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load lecturers.");
    } finally {
      setLoading(false);
    }
  }, [pagination.limit, search]);

  useEffect(() => { fetchLecturers(1, ""); }, []);

  // ── Search (debounced via button / Enter) ────────────────────────────────
  const handleSearch = () => {
    setSearch(searchInput);
    fetchLecturers(1, searchInput);
  };

  const handleSearchKeyDown = (e) => { if (e.key === "Enter") handleSearch(); };

  const handleClearSearch = () => {
    setSearchInput("");
    setSearch("");
    fetchLecturers(1, "");
  };

  // ── Pagination ───────────────────────────────────────────────────────────
  const goToPage = (p) => fetchLecturers(p, search);

  // ── CRUD callbacks ───────────────────────────────────────────────────────
  const handleCreateSuccess = () => { fetchLecturers(1, search); setShowAddModal(false); };
  const handleEditSuccess   = () => { fetchLecturers(pagination.page, search); setShowEditModal(false); };

  const handleDeleteConfirm = async () => {
    try {
      await lecturerAPI.delete(selectedLecturer.LecturerId);
      toast.success(`Lecturer "${selectedLecturer.FullName}" deleted.`);
      setShowDeleteModal(false);
      fetchLecturers(pagination.page, search);
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed.");
    }
  };

  const handleExportExcel = async () => {
    try {
      toast.info("Đang xuất file Excel...");
      const res = await lecturerAPI.exportExcel({ search });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "Danh_sach_Giang_vien.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Xuất Excel thành công!");
    } catch (err) {
      toast.error("Xuất Excel thất bại.");
    }
  };

  const openEdit   = (l) => { setSelectedLecturer(l); setShowEditModal(true); };
  const openDelete = (l) => { setSelectedLecturer(l); setShowDeleteModal(true); };
  const openDetail = (l) => { setSelectedLecturer(l); setShowDetailModal(true); };

  // ── Pagination helper ─────────────────────────────────────────────────────
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
      {/* ── Top Bar ─────────────────────────────────────────────────── */}
      <div className="topbar">
        <div>
          <div className="topbar-title">Quản lý Giảng viên</div>
          <div className="topbar-subtitle">Xem, thêm, sửa, xóa tài khoản giảng viên</div>
        </div>
        <span className="role-badge admin">ADMIN</span>
      </div>

      <div className="page-content">
        {/* ── Toolbar ───────────────────────────────────────────────── */}
        <div className="lm-toolbar">
          <div className="lm-search-group">
            <div className="lm-search-wrapper">
              <span className="lm-search-icon"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg></span>
              <input
                className="lm-search-input"
                type="text"
                placeholder="Tìm theo mã, tên, khoa, email..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleSearchKeyDown}
              />
              {searchInput && (
                <button className="lm-clear-btn" onClick={handleClearSearch}>✕</button>
              )}
            </div>
            <button className="lm-search-btn" onClick={handleSearch}>Tìm kiếm</button>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button className="btn-secondary" onClick={handleExportExcel}>
              <svg className="w-4 h-4 mr-1 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> Xuất Excel
            </button>
            <button className="lm-add-btn" onClick={() => setShowAddModal(true)}>
              <svg className="w-4 h-4 mr-1 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg> Thêm Giảng viên
            </button>
          </div>
        </div>

        {/* ── Stats strip ───────────────────────────────────────────── */}
        <div className="lm-stats-strip">
          <span>Tổng: <strong>{pagination.total}</strong> giảng viên</span>
          {search && <span className="lm-filter-tag">🔍 &quot;{search}&quot;</span>}
        </div>

        {/* ── Table ─────────────────────────────────────────────────── */}
        <div className="lm-table-card">
          {loading ? (
            <div className="lm-empty-state">
              <div className="spinner-blue"></div>
              <p>Đang tải dữ liệu...</p>
            </div>
          ) : lecturers.length === 0 ? (
            <div className="lm-empty-state">
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
                <svg className="w-12 h-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              </div>
              <p style={{ fontWeight: 600, color: "var(--text-secondary)", marginTop: 8 }}>
                Không tìm thấy giảng viên
              </p>
              <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
                {search ? "Thử từ khóa khác hoặc xóa bộ lọc" : "Nhấn \"Thêm Giảng viên\" để tạo mới"}
              </p>
            </div>
          ) : (
            <div className="lm-table-wrapper">
              <table className="lm-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Mã GV</th>
                    <th>Họ và tên</th>
                    <th>Khoa / Bộ môn</th>
                    <th>Email</th>
                    <th>Điện thoại</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {lecturers.map((l, i) => (
                    <tr key={l.LecturerId} className="lm-table-row">
                      <td className="lm-td-num">
                        {(pagination.page - 1) * pagination.limit + i + 1}
                      </td>
                      <td>
                        <span className="lm-code-badge">{l.LecturerCode}</span>
                      </td>
                      <td>
                        <div className="lm-name-cell">
                          <div className="lm-avatar">{l.FullName.charAt(0)}</div>
                          <span className="lm-name">{l.FullName}</span>
                        </div>
                      </td>
                      <td>{l.Department || <span className="lm-na">—</span>}</td>
                      <td>{l.Email || <span className="lm-na">—</span>}</td>
                      <td>{l.Phone || <span className="lm-na">—</span>}</td>
                      <td>
                        <span className={`lm-status ${l.IsActive ? "active" : "inactive"}`}>
                          {l.IsActive ? "● Hoạt động" : "● Vô hiệu"}
                        </span>
                      </td>
                      <td>
                        <div className="lm-action-group">
                          <button className="lm-btn-detail" onClick={() => openDetail(l)} title="Chi tiết"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg></button>
                          <button className="lm-btn-edit"   onClick={() => openEdit(l)}   title="Chỉnh sửa"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                          <button className="lm-btn-delete" onClick={() => openDelete(l)} title="Xóa"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                        </div>
                      </td>
                    </tr>
                  ))}
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

            {buildPageNumbers().map((p) => (
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
      {showAddModal && (
        <LecturerModal
          mode="add"
          onClose={() => setShowAddModal(false)}
          onSuccess={handleCreateSuccess}
        />
      )}
      {showEditModal && selectedLecturer && (
        <LecturerModal
          mode="edit"
          lecturer={selectedLecturer}
          onClose={() => setShowEditModal(false)}
          onSuccess={handleEditSuccess}
        />
      )}
      {showDeleteModal && selectedLecturer && (
        <DeleteConfirmModal
          lecturer={selectedLecturer}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteConfirm}
        />
      )}
      {showDetailModal && selectedLecturer && (
        <LecturerDetailModal
          lecturer={selectedLecturer}
          onClose={() => setShowDetailModal(false)}
          onEdit={() => { setShowDetailModal(false); openEdit(selectedLecturer); }}
        />
      )}
    </>
  );
};

export default LecturerManagement;
