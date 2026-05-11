import { useState, useEffect, useCallback } from "react";
import { reportAPI, periodAPI, lecturerAPI } from "../services/api";
import { useToast } from "../context/ToastContext";
import ReportReviewModal from "../components/report/ReportReviewModal";

const DEFAULT_FILTERS = { periodId: "", lecturerId: "", status: "", type: "", studentId: "" };

const STATUS_MAP = {
  PENDING: { label: "Chờ duyệt", cls: "text-amber-600 bg-amber-50" },
  APPROVED: { label: "Đã duyệt", cls: "text-green-600 bg-green-50" },
  REVISION_REQUIRED: { label: "Yêu cầu làm lại", cls: "text-red-600 bg-red-50" },
  REJECTED: { label: "Bị từ chối", cls: "text-slate-600 bg-slate-100" }
};

const ReportManagement = () => {
  const toast = useToast();
  
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  const [periods, setPeriods] = useState([]);
  const [lecturers, setLecturers] = useState([]);

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [pRes, lRes] = await Promise.all([
          periodAPI.getAll({ limit: 100 }),
          lecturerAPI.getAll({ limit: 500 })
        ]);
        setPeriods(pRes.data.data.periods);
        setLecturers(lRes.data.data.lecturers);
      } catch (err) {
        console.error(err);
      }
    };
    fetchOptions();
  }, []);

  const fetchReports = useCallback(async (activeFilters = filters) => {
    try {
      setLoading(true);
      const params = {
        ...Object.fromEntries(Object.entries(activeFilters).filter(([, v]) => v !== ""))
      };
      const res = await reportAPI.getAll(params);
      setReports(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Không thể tải danh sách báo cáo.");
    } finally {
      setLoading(false);
    }
  }, [filters, toast]);

  useEffect(() => { fetchReports(DEFAULT_FILTERS); }, []);

  const handleFilterChange = (name, value) => {
    const newFilters = { ...filters, [name]: value };
    setFilters(newFilters);
    fetchReports(newFilters);
  };

  const handleClearFilters = () => {
    setFilters(DEFAULT_FILTERS);
    fetchReports(DEFAULT_FILTERS);
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== "");

  const handleExportExcel = async () => {
    try {
      toast.info("Đang xuất file Excel...");
      const res = await reportAPI.exportExcel({
        periodId: filters.periodId,
        lecturerId: filters.lecturerId,
        status: filters.status,
        type: filters.type
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "Danh_sach_Bao_cao.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Xuất Excel thành công!");
    } catch (err) {
      toast.error("Xuất Excel thất bại.");
    }
  };

  return (
    <>
      <div className="topbar">
        <div>
          <div className="topbar-title">Quản lý báo cáo</div>
          <div className="topbar-subtitle">Kiểm duyệt báo cáo tuần và báo cáo tổng kết</div>
        </div>
        <span className="role-badge admin">QUẢN TRỊ</span>
      </div>

      <div className="page-content">
        <div className="sm-filter-card">
          <div className="lm-toolbar" style={{ marginBottom: 12 }}>
            <div className="lm-search-group">
              <input
                className="lm-search-input"
                type="text"
                placeholder="Lọc theo Student ID..."
                value={filters.studentId}
                onChange={e => setFilters({...filters, studentId: e.target.value})}
                onKeyDown={e => e.key === 'Enter' && fetchReports(filters)}
              />
              <button className="lm-search-btn" onClick={() => fetchReports(filters)}>Tìm kiếm</button>
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
              <label className="sm-filter-label">Loại báo cáo</label>
              <select className="sm-filter-select" value={filters.type} onChange={e => handleFilterChange("type", e.target.value)}>
                <option value="">Tất cả</option>
                <option value="WEEKLY">Báo cáo tuần</option>
                <option value="FINAL">Báo cáo cuối kỳ</option>
              </select>
            </div>
            <div className="sm-filter-group">
              <label className="sm-filter-label">Trạng thái</label>
              <select className="sm-filter-select" value={filters.status} onChange={e => handleFilterChange("status", e.target.value)}>
                <option value="">Tất cả</option>
                <option value="PENDING">Chờ duyệt</option>
                <option value="APPROVED">Đã duyệt</option>
                <option value="REVISION_REQUIRED">Yêu cầu làm lại</option>
                <option value="REJECTED">Bị từ chối</option>
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
          ) : reports.length === 0 ? (
            <div className="lm-empty-state">
              <p style={{ fontWeight: 600 }}>Không tìm thấy báo cáo nào</p>
            </div>
          ) : (
            <div className="lm-table-wrapper">
              <table className="lm-table">
                <thead>
                  <tr>
                    <th>Sinh viên</th>
                    <th>Loại</th>
                    <th>Tên báo cáo</th>
                    <th>Giảng viên & Đợt</th>
                    <th>Ngày nộp</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r, idx) => {
                    const status = STATUS_MAP[r.Status] || { label: r.Status, cls: "" };
                    return (
                      <tr key={idx} className="lm-table-row">
                        <td>
                          <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{r.StudentName}</div>
                          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>{r.StudentCode}</div>
                        </td>
                        <td>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${r.Type === 'FINAL' ? 'bg-indigo-50 text-indigo-700' : 'bg-blue-50 text-blue-700'}`}>
                            {r.Type === 'FINAL' ? "Tổng kết" : `Tuần ${r.WeekNumber}`}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 500, maxWidth: "200px" }} className="truncate" title={r.Title}>{r.Title}</div>
                          {r.FilePath && (
                            <a href={`http://localhost:5000/${r.FilePath}`} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline mt-1 inline-block">
                              <svg className="w-3 h-3 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                              File đính kèm
                            </a>
                          )}
                        </td>
                        <td>
                          <div style={{ fontSize: "13px" }}>{r.LecturerName || "Chưa phân công"}</div>
                          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>{r.PeriodName}</div>
                        </td>
                        <td>{r.SubmittedAt ? new Date(r.SubmittedAt).toLocaleDateString("vi-VN") : "—"}</td>
                        <td>
                          <span className={`px-2 py-1 text-xs font-medium rounded ${status.cls}`}>{status.label}</span>
                        </td>
                        <td>
                          <button 
                            className="text-blue-600 hover:bg-blue-50 px-2 py-1 rounded text-sm font-medium transition-colors"
                            onClick={() => { setSelectedReport(r); setShowReviewModal(true); }}
                          >
                            Chi tiết & Duyệt
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showReviewModal && selectedReport && (
        <ReportReviewModal 
          report={selectedReport} 
          onClose={() => setShowReviewModal(false)} 
          onSuccess={() => { setShowReviewModal(false); fetchReports(filters); }} 
        />
      )}
    </>
  );
};

export default ReportManagement;
