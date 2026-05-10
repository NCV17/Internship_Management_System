import { useState, useEffect } from "react";
import { periodAPI } from "../../services/api";
import { useToast } from "../../context/ToastContext";

const Row = ({ label, value }) => (
  <div className="detail-row">
    <div className="detail-label">{label}</div>
    <div className="detail-value">{value || <span className="text-slate-400 italic">Không có thông tin</span>}</div>
  </div>
);

const STATUS_MAP = {
  UPCOMING: { label: "Sắp diễn ra", cls: "bg-blue-100 text-blue-800" },
  ACTIVE: { label: "Đang diễn ra", cls: "bg-green-100 text-green-800" },
  CLOSED: { label: "Đã đóng", cls: "bg-gray-100 text-gray-800" },
};

const StatCard = ({ title, value, icon, colorClass }) => (
  <div className={`p-4 rounded-xl border ${colorClass}`} style={{ display: "flex", alignItems: "center", gap: "16px" }}>
    <div className="p-3 rounded-lg bg-white/60 shadow-sm">{icon}</div>
    <div>
      <div className="text-sm font-medium text-slate-600 mb-1">{title}</div>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
    </div>
  </div>
);

const PeriodDetailModal = ({ period, onClose }) => {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [companies, setCompanies] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await periodAPI.getStatistics(period.PeriodId);
        setStats(res.data.data.statistics);
        setCompanies(res.data.data.companies);
      } catch (err) {
        toast.error("Không thể tải dữ liệu thống kê.");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [period.PeriodId, toast]);

  const status = STATUS_MAP[period.Status] || STATUS_MAP["UPCOMING"];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: "800px", width: "90vw", maxHeight: "90vh", display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}>
        
        <div className="modal-header">
          <div className="modal-title-group">
            <span className="modal-icon">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </span>
            <div>
              <h2 className="modal-title">Chi tiết Đợt Thực tập</h2>
              <p className="modal-subtitle">{period.PeriodName}</p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body" style={{ overflowY: "auto", paddingBottom: "24px" }}>
          
          {/* Thông tin cơ bản */}
          <div className="detail-section mb-6">
            <h4 className="detail-section-title">Thông tin cơ bản</h4>
            <div className="grid grid-cols-2 gap-x-8">
              <Row label="Tên đợt" value={period.PeriodName} />
              <Row label="Học kỳ" value={period.Semester} />
              <Row label="Năm học" value={period.AcademicYear} />
              <Row label="Trạng thái" value={
                <span className={`px-2 py-1 rounded text-xs font-medium ${status.cls}`}>{status.label}</span>
              } />
              <Row label="Ngày bắt đầu" value={new Date(period.StartDate).toLocaleDateString("vi-VN")} />
              <Row label="Ngày kết thúc" value={new Date(period.EndDate).toLocaleDateString("vi-VN")} />
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-10">
              <div className="spinner-blue"></div>
              <p className="mt-4 text-slate-500">Đang tải thống kê...</p>
            </div>
          ) : stats && (
            <>
              <div className="detail-section" style={{ marginBottom: "24px" }}>
                <h4 className="detail-section-title">Thống kê Tổng quan</h4>
                <div style={{ display: "flex", gap: "16px", marginBottom: "24px" }}>
                  <div style={{ flex: 1 }}>
                    <StatCard 
                      title="Sinh viên tham gia" 
                      value={stats.totalStudents} 
                      colorClass="bg-blue-50 border-blue-100"
                      icon={<svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <StatCard 
                      title="Giảng viên hướng dẫn" 
                      value={stats.totalLecturers} 
                      colorClass="bg-purple-50 border-purple-100"
                      icon={<svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <StatCard 
                      title="Công ty tiếp nhận" 
                      value={stats.totalCompanies} 
                      colorClass="bg-amber-50 border-amber-100"
                      icon={<svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
                    />
                  </div>
                </div>

                {/* Progress bar */}
                <div className="p-5 border rounded-xl bg-slate-50" style={{ marginTop: "24px" }}>
                  <div className="flex justify-between items-end mb-2">
                    <div>
                      <div className="text-sm font-medium text-slate-600">Tiến độ hoàn thành</div>
                      <div className="text-xs text-slate-500 mt-1">
                        Hoàn thành: <strong>{stats.completed}</strong> • 
                        Đang thực tập: <strong>{stats.inProgress}</strong> • 
                        Chưa bắt đầu: <strong>{stats.notStarted}</strong>
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-green-600">{stats.completionRate}%</div>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2.5">
                    <div className="bg-green-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${stats.completionRate}%` }}></div>
                  </div>
                </div>
              </div>

              {/* Company Participation Table */}
              <div style={{ marginTop: "32px" }}>
                <h4 className="detail-section-title">Danh sách công ty tiếp nhận</h4>
                {companies.length === 0 ? (
                  <div className="text-center p-6 border border-dashed rounded-xl bg-slate-50 text-slate-500">
                    Chưa có sinh viên đăng ký công ty thực tập trong đợt này.
                  </div>
                ) : (
                  <div className="border rounded-xl overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-100 text-slate-600 border-b">
                        <tr>
                          <th className="px-4 py-3 font-semibold">STT</th>
                          <th className="px-4 py-3 font-semibold">Tên công ty</th>
                          <th className="px-4 py-3 font-semibold text-right">Số sinh viên tiếp nhận</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y text-slate-700">
                        {companies.map((c, i) => (
                          <tr key={c.CompanyId} className="hover:bg-slate-50">
                            <td className="px-4 py-3 w-16">{i + 1}</td>
                            <td className="px-4 py-3 font-medium">{c.CompanyName}</td>
                            <td className="px-4 py-3 text-right">
                              <span className="inline-flex items-center justify-center px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-semibold">
                                {c.StudentCount} sinh viên
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default PeriodDetailModal;
