import { useState, useEffect } from "react";
import { companyAPI } from "../../services/api";
import { useToast } from "../../context/ToastContext";

const Row = ({ label, value }) => (
  <div className="detail-row">
    <div className="detail-label">{label}</div>
    <div className="detail-value">{value || <span className="text-slate-400 italic">Không có thông tin</span>}</div>
  </div>
);

const STATUS_MAP = {
  NOT_STARTED: { label: "Chưa bắt đầu", cls: "status-not-started" },
  IN_PROGRESS:  { label: "Đang thực tập", cls: "status-in-progress" },
  COMPLETED:    { label: "Hoàn thành",    cls: "status-completed" },
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

const CompanyDetailModal = ({ company, periodId, onClose }) => {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [periods, setPeriods] = useState([]);
  const [students, setStudents] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await companyAPI.getStatistics(company.CompanyId, periodId);
        setStats(res.data.data.statistics);
        setPeriods(res.data.data.periods);
        setStudents(res.data.data.students);
      } catch (err) {
        toast.error("Không thể tải dữ liệu thống kê.");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [company.CompanyId, periodId, toast]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: "900px", width: "95vw", maxHeight: "90vh", display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}>
        
        <div className="modal-header">
          <div className="modal-title-group">
            <span className="modal-icon">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </span>
            <div>
              <h2 className="modal-title">Hồ sơ Công ty Thực tập</h2>
              <p className="modal-subtitle">{company.CompanyName}</p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body" style={{ overflowY: "auto", paddingBottom: "24px" }}>
          
          {/* Thông tin cơ bản */}
          <div className="detail-section mb-6">
            <h4 className="detail-section-title">Thông tin cơ bản</h4>
            <div className="grid grid-cols-2 gap-x-8">
              <Row label="Tên công ty" value={company.CompanyName} />
              <Row label="Lĩnh vực" value={company.Field} />
              <Row label="Địa chỉ" value={company.Address} />
              <Row label="Người liên hệ" value={company.ContactPerson} />
              <Row label="Email liên hệ" value={company.ContactEmail} />
              <Row label="Số điện thoại" value={company.ContactPhone} />
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-10">
              <div className="spinner-blue"></div>
              <p className="mt-4 text-slate-500">Đang tải thống kê...</p>
            </div>
          ) : stats && (
            <>
              {/* Thống kê Tổng quan */}
              <div className="detail-section" style={{ marginBottom: "24px" }}>
                <h4 className="detail-section-title">
                  Thống kê Tổng quan {periodId ? "(Đã lọc theo đợt)" : "(Tất cả các đợt)"}
                </h4>
                <div style={{ display: "flex", gap: "16px", marginBottom: "24px" }}>
                  <div style={{ flex: 1 }}>
                    <StatCard 
                      title="Tổng SV tiếp nhận" 
                      value={stats.totalStudents} 
                      colorClass="bg-blue-50 border-blue-100"
                      icon={<svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <StatCard 
                      title="Số đợt tham gia" 
                      value={stats.totalPeriods} 
                      colorClass="bg-purple-50 border-purple-100"
                      icon={<svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                    />
                  </div>
                </div>

                {/* Progress bar */}
                <div className="p-5 border rounded-xl bg-slate-50" style={{ marginTop: "24px" }}>
                  <div className="flex justify-between items-end mb-2">
                    <div>
                      <div className="text-sm font-medium text-slate-600">Tiến độ hoàn thành của Sinh viên</div>
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

              {/* Danh sách các đợt thực tập tham gia */}
              {!periodId && periods.length > 0 && (
                <div style={{ marginTop: "32px" }}>
                  <h4 className="detail-section-title">Các đợt thực tập đã tham gia</h4>
                  <div className="border rounded-xl overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-100 text-slate-600 border-b">
                        <tr>
                          <th className="px-4 py-3 font-semibold">Đợt thực tập</th>
                          <th className="px-4 py-3 font-semibold">Học kỳ / Năm học</th>
                          <th className="px-4 py-3 font-semibold text-right">Sinh viên tiếp nhận</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y text-slate-700">
                        {periods.map((p) => (
                          <tr key={p.PeriodId} className="hover:bg-slate-50">
                            <td className="px-4 py-3 font-medium">{p.PeriodName}</td>
                            <td className="px-4 py-3">{p.Semester} - {p.AcademicYear}</td>
                            <td className="px-4 py-3 text-right">
                              <span className="inline-flex items-center justify-center px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-semibold">
                                {p.StudentCount} sinh viên
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Company Participation Table */}
              <div style={{ marginTop: "32px" }}>
                <h4 className="detail-section-title">Danh sách Sinh viên đang thực tập</h4>
                {students.length === 0 ? (
                  <div className="text-center p-6 border border-dashed rounded-xl bg-slate-50 text-slate-500">
                    Chưa có sinh viên nào thực tập tại công ty này.
                  </div>
                ) : (
                  <div className="border rounded-xl overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-100 text-slate-600 border-b">
                        <tr>
                          <th className="px-4 py-3 font-semibold">MSSV</th>
                          <th className="px-4 py-3 font-semibold">Họ tên</th>
                          <th className="px-4 py-3 font-semibold">Đợt thực tập</th>
                          <th className="px-4 py-3 font-semibold">Giảng viên HD</th>
                          <th className="px-4 py-3 font-semibold">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y text-slate-700">
                        {students.map((s) => {
                          const status = STATUS_MAP[s.InternshipStatus] || STATUS_MAP["NOT_STARTED"];
                          return (
                            <tr key={s.StudentId} className="hover:bg-slate-50">
                              <td className="px-4 py-3 font-medium text-blue-600">{s.StudentCode}</td>
                              <td className="px-4 py-3 font-medium">{s.FullName}</td>
                              <td className="px-4 py-3">{s.PeriodName || "—"}</td>
                              <td className="px-4 py-3">{s.LecturerName || "—"}</td>
                              <td className="px-4 py-3">
                                <span className={`sm-status-badge ${status.cls}`}>{status.label}</span>
                              </td>
                            </tr>
                          );
                        })}
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

export default CompanyDetailModal;
