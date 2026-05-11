import { useState, useEffect, useCallback } from "react";
import { assignmentAPI, periodAPI, lecturerAPI, companyAPI } from "../services/api";
import { useToast } from "../context/ToastContext";
import AssignmentCreateModal from "../components/assignment/AssignmentCreateModal";
import AssignmentEditModal from "../components/assignment/AssignmentEditModal";
import AssignmentDetailModal from "../components/assignment/AssignmentDetailModal";

const DEFAULT_FILTERS = { search: "", periodId: "", lecturerId: "", companyId: "", status: "" };

const STATUS_MAP = {
  NOT_STARTED: { label: "Chưa bắt đầu", cls: "status-not-started" },
  IN_PROGRESS:  { label: "Đang thực tập", cls: "status-in-progress" },
  COMPLETED:    { label: "Hoàn thành",    cls: "status-completed" },
};

const AssignmentManagement = () => {
  const toast = useToast();
  
  const [assignments, setAssignments] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [searchInput, setSearchInput] = useState("");

  const [periods, setPeriods] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [companies, setCompanies] = useState([]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showWorkloadModal, setShowWorkloadModal] = useState(false);
  const [workloadStats, setWorkloadStats] = useState([]);

  const [selectedAssignment, setSelectedAssignment] = useState(null);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [pRes, lRes, cRes] = await Promise.all([
          periodAPI.getAll({ limit: 100 }),
          lecturerAPI.getAll({ limit: 500 }),
          companyAPI.getAll({ limit: 500 })
        ]);
        setPeriods(pRes.data.data.periods);
        setLecturers(lRes.data.data.lecturers);
        setCompanies(cRes.data.data.companies);
      } catch (err) {
        console.error(err);
      }
    };
    fetchOptions();
  }, []);

  const fetchAssignments = useCallback(async (page = 1, activeFilters = filters) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: pagination.limit,
        ...Object.fromEntries(Object.entries(activeFilters).filter(([, v]) => v !== ""))
      };
      const res = await assignmentAPI.getAll(params);
      setAssignments(res.data.data.assignments);
      setPagination(res.data.data.pagination);
    } catch (err) {
      toast.error(err.response?.data?.message || "Không thể tải danh sách phân công.");
    } finally {
      setLoading(false);
    }
  }, [pagination.limit, filters]);

  useEffect(() => { fetchAssignments(1, DEFAULT_FILTERS); }, []);

  const handleSearch = () => {
    const newFilters = { ...filters, search: searchInput };
    setFilters(newFilters);
    fetchAssignments(1, newFilters);
  };

  const handleSearchKeyDown = (e) => { if (e.key === "Enter") handleSearch(); };

  const handleClearSearch = () => {
    setSearchInput("");
    const newFilters = { ...filters, search: "" };
    setFilters(newFilters);
    fetchAssignments(1, newFilters);
  };

  const handleFilterChange = (name, value) => {
    const newFilters = { ...filters, [name]: value };
    setFilters(newFilters);
    fetchAssignments(1, newFilters);
  };

  const handleClearFilters = () => {
    setSearchInput("");
    setFilters(DEFAULT_FILTERS);
    fetchAssignments(1, DEFAULT_FILTERS);
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== "");

  const handleDelete = async () => {
    try {
      await assignmentAPI.delete(selectedAssignment.AssignmentId);
      toast.success("Đã xóa phân công.");
      setShowDeleteConfirm(false);
      fetchAssignments(pagination.page, filters);
    } catch (err) {
      toast.error(err.response?.data?.message || "Xóa thất bại.");
      setShowDeleteConfirm(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      toast.info("Đang xuất file Excel...");
      const res = await assignmentAPI.exportExcel({
        search: filters.search,
        periodId: filters.periodId,
        lecturerId: filters.lecturerId,
        companyId: filters.companyId,
        status: filters.status,
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "Phan_cong_huong_dan.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Xuất Excel thành công!");
    } catch (err) {
      toast.error("Xuất Excel thất bại.");
    }
  };

  const handleViewWorkload = async () => {
    try {
      setShowWorkloadModal(true);
      const res = await assignmentAPI.getWorkloadStatistics({ periodId: filters.periodId });
      setWorkloadStats(res.data.data);
    } catch (err) {
      toast.error("Không thể tải thống kê khối lượng.");
    }
  };

  const goToPage = (p) => fetchAssignments(p, filters);

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
          <div className="topbar-title">Phân công hướng dẫn</div>
          <div className="topbar-subtitle">Quản lý phân công Giảng viên hướng dẫn cho Sinh viên</div>
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
                  placeholder="Tìm MSSV, tên SV, mã GV, tên GV..."
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
              <button className="btn-secondary" onClick={handleViewWorkload}>
                <svg className="w-4 h-4 mr-1 inline-block text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg> Khối lượng GV
              </button>
              <button className="btn-secondary" onClick={handleExportExcel}>
                <svg className="w-4 h-4 mr-1 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> Xuất Excel
              </button>
              <button className="lm-add-btn" onClick={() => setShowCreateModal(true)}>
                <svg className="w-4 h-4 mr-1 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Phân công
              </button>
            </div>
          </div>

          <div className="sm-filter-row">
            <div className="sm-filter-group">
              <label className="sm-filter-label">Đợt thực tập</label>
              <select className="sm-filter-select" value={filters.periodId} onChange={e => handleFilterChange("periodId", e.target.value)}>
                <option value="">Tất cả đợt</option>
                {periods.map(p => <option key={p.PeriodId} value={p.PeriodId}>{p.PeriodName}</option>)}
              </select>
            </div>
            <div className="sm-filter-group">
              <label className="sm-filter-label">Giảng viên</label>
              <select className="sm-filter-select" value={filters.lecturerId} onChange={e => handleFilterChange("lecturerId", e.target.value)}>
                <option value="">Tất cả GV</option>
                {lecturers.map(l => <option key={l.LecturerId} value={l.LecturerId}>{l.FullName} ({l.LecturerCode})</option>)}
              </select>
            </div>
            <div className="sm-filter-group">
              <label className="sm-filter-label">Công ty</label>
              <select className="sm-filter-select" value={filters.companyId} onChange={e => handleFilterChange("companyId", e.target.value)}>
                <option value="">Tất cả Công ty</option>
                {companies.map(c => <option key={c.CompanyId} value={c.CompanyId}>{c.CompanyName}</option>)}
              </select>
            </div>
            <div className="sm-filter-group">
              <label className="sm-filter-label">Trạng thái SV</label>
              <select className="sm-filter-select" value={filters.status} onChange={e => handleFilterChange("status", e.target.value)}>
                <option value="">Tất cả</option>
                <option value="NOT_STARTED">Chưa bắt đầu</option>
                <option value="IN_PROGRESS">Đang thực tập</option>
                <option value="COMPLETED">Hoàn thành</option>
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
          ) : assignments.length === 0 ? (
            <div className="lm-empty-state">
              <p style={{ fontWeight: 600 }}>Không tìm thấy phân công</p>
            </div>
          ) : (
            <div className="lm-table-wrapper">
              <table className="lm-table">
                <thead>
                  <tr>
                    <th>Sinh viên</th>
                    <th>Công ty thực tập</th>
                    <th>Giảng viên HD</th>
                    <th>Đợt thực tập</th>
                    <th>Trạng thái</th>
                    <th>Ngày phân công</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((a) => {
                    const status = STATUS_MAP[a.InternshipStatus] || STATUS_MAP["NOT_STARTED"];
                    return (
                      <tr key={a.AssignmentId} className="lm-table-row">
                        <td>
                          <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{a.StudentName}</div>
                          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                            {a.StudentCode} • {a.ClassName} • GPA: {a.GPA || "—"}
                          </div>
                        </td>
                        <td>{a.CompanyName || <span className="lm-na">Chưa ĐK</span>}</td>
                        <td>
                          <div style={{ fontWeight: 500 }}>{a.LecturerName}</div>
                          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>{a.LecturerCode}</div>
                        </td>
                        <td>{a.PeriodName}</td>
                        <td>
                          <span className={`sm-status-badge ${status.cls}`}>{status.label}</span>
                        </td>
                        <td>{a.AssignedDate ? new Date(a.AssignedDate).toLocaleDateString("vi-VN") : "—"}</td>
                        <td>
                          <div className="lm-action-group">
                            <button className="lm-btn-detail" onClick={() => { setSelectedAssignment(a); setShowDetailModal(true); }} title="Chi tiết">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            </button>
                            <button className="lm-btn-edit" onClick={() => { setSelectedAssignment(a); setShowEditModal(true); }} title="Chỉnh sửa">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            </button>
                            <button className="lm-btn-delete" onClick={() => { setSelectedAssignment(a); setShowDeleteConfirm(true); }} title="Xóa">
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

      {showCreateModal && <AssignmentCreateModal periods={periods} lecturers={lecturers} onClose={() => setShowCreateModal(false)} onSuccess={() => { setShowCreateModal(false); fetchAssignments(1); }} />}
      {showEditModal && selectedAssignment && <AssignmentEditModal assignment={selectedAssignment} periods={periods} lecturers={lecturers} onClose={() => setShowEditModal(false)} onSuccess={() => { setShowEditModal(false); fetchAssignments(pagination.page); }} />}
      {showDetailModal && selectedAssignment && <AssignmentDetailModal assignmentId={selectedAssignment.AssignmentId} onClose={() => setShowDetailModal(false)} />}
      
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-box" style={{ maxWidth: "400px" }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Xác nhận xóa phân công</h3>
              <button className="modal-close" onClick={() => setShowDeleteConfirm(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p>Bạn có chắc muốn xóa phân công của sinh viên <strong>{selectedAssignment?.StudentName}</strong>?</p>
              <p className="text-xs text-red-600 mt-2">* Nếu sinh viên đã có điểm số, đánh giá hoặc báo cáo, thao tác này sẽ không được phép.</p>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowDeleteConfirm(false)}>Hủy</button>
              <button className="btn-primary bg-red-600 hover:bg-red-700 text-white" onClick={handleDelete}>Xóa</button>
            </div>
          </div>
        </div>
      )}

      {showWorkloadModal && (
        <div className="modal-overlay" onClick={() => setShowWorkloadModal(false)}>
          <div className="modal-box" style={{ maxWidth: "700px", maxHeight: "90vh", display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <span className="modal-icon">
                  <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                </span>
                <div>
                  <h2 className="modal-title">Thống kê khối lượng Giảng viên</h2>
                  <p className="modal-subtitle">Số lượng sinh viên hướng dẫn {filters.periodId ? "trong đợt hiện tại" : "toàn thời gian"}</p>
                </div>
              </div>
              <button className="modal-close" onClick={() => setShowWorkloadModal(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ overflowY: "auto" }}>
              {workloadStats.length === 0 ? (
                <div className="text-center p-6 border border-dashed rounded-xl bg-slate-50 text-slate-500">
                  Không có dữ liệu phân công.
                </div>
              ) : (
                <div className="border rounded-xl overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-100 text-slate-600 border-b">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Giảng viên</th>
                        <th className="px-4 py-3 font-semibold text-center">Tổng phân công</th>
                        <th className="px-4 py-3 font-semibold text-center">Hoàn thành</th>
                        <th className="px-4 py-3 font-semibold text-center">Đang thực tập</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-slate-700">
                      {workloadStats.map((w) => (
                        <tr key={w.LecturerId} className="hover:bg-slate-50">
                          <td className="px-4 py-3">
                            <div className="font-medium">{w.LecturerName}</div>
                            <div className="text-xs text-slate-500">{w.LecturerCode}</div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-flex items-center justify-center px-2 py-1 bg-purple-50 text-purple-700 rounded font-semibold text-xs">
                              {w.TotalStudents} SV
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center text-green-600 font-medium">{w.CompletedStudents}</td>
                          <td className="px-4 py-3 text-center text-blue-600 font-medium">{w.InProgressStudents}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AssignmentManagement;
