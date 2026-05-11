import { useState, useEffect } from "react";
import { periodAPI } from "../../services/api";
import { useToast } from "../../context/ToastContext";
import { Calendar, Users, GraduationCap, Building2, CheckCircle2, Clock, AlertCircle } from "lucide-react";

const Row = ({ label, value }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: "4px", padding: "12px", background: "var(--bg-page)", borderRadius: "var(--radius-md)" }}>
    <div style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</div>
    <div style={{ fontSize: "14px", color: "var(--text-primary)", fontWeight: 600 }}>{value || <span className="text-slate-400 italic font-normal">Không có thông tin</span>}</div>
  </div>
);

const STATUS_MAP = {
  UPCOMING: { label: "Sắp diễn ra", cls: "bg-blue-100 text-blue-700 border-blue-200" },
  ACTIVE: { label: "Đang diễn ra", cls: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  CLOSED: { label: "Đã đóng", cls: "bg-slate-100 text-slate-700 border-slate-200" },
};

const StatCard = ({ title, value, icon: Icon, color }) => {
  const palette = {
    blue:   { bg: "bg-blue-50",   text: "text-blue-600",   border: "border-blue-100" },
    purple: { bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-100" },
    amber:  { bg: "bg-amber-50",  text: "text-amber-600",  border: "border-amber-100" },
  };
  const c = palette[color] || palette.blue;

  return (
    <div className={`p-5 rounded-2xl border ${c.border} ${c.bg} flex items-center gap-4 transition-transform hover:-translate-y-1`} style={{ flex: 1 }}>
      <div className={`w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center ${c.text}`}>
        <Icon size={24} strokeWidth={2} />
      </div>
      <div>
        <div className="text-3xl font-black text-slate-800 leading-none mb-1">{value}</div>
        <div className="text-sm font-semibold text-slate-500">{title}</div>
      </div>
    </div>
  );
};

const PeriodDetailModal = ({ period, onClose }) => {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [lecturers, setLecturers] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await periodAPI.getStatistics(period.PeriodId);
        setStats(res.data.data.statistics);
        setCompanies(res.data.data.companies || []);
        setLecturers(res.data.data.lecturers || []);
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
    <div className="modal-overlay" onClick={onClose} style={{ padding: "20px" }}>
      <div className="modal-box" style={{ maxWidth: "1000px", width: "100%", maxHeight: "calc(100vh - 40px)", display: "flex", flexDirection: "column", borderRadius: "20px" }} onClick={e => e.stopPropagation()}>
        
        <div className="modal-header" style={{ padding: "24px 32px", borderBottom: "1px solid var(--border)" }}>
          <div className="modal-title-group" style={{ gap: "16px" }}>
            <span className="modal-icon" style={{ width: "48px", height: "48px", borderRadius: "14px", background: "var(--primary-light)", color: "var(--primary)" }}>
              <Calendar size={24} />
            </span>
            <div>
              <h2 className="modal-title" style={{ fontSize: "22px" }}>Chi tiết Đợt Thực tập</h2>
              <p className="modal-subtitle" style={{ fontSize: "15px", marginTop: "4px" }}>{period.PeriodName}</p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose} style={{ background: "var(--bg-page)" }}>✕</button>
        </div>

        <div className="modal-body" style={{ overflowY: "auto", padding: "32px", display: "flex", flexDirection: "column", gap: "32px", background: "#f8fafc" }}>
          
          {/* Thông tin cơ bản */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h4 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-blue-500 rounded-full"></span>
              Thông tin đợt thực tập
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Row label="Tên đợt" value={period.PeriodName} />
              <Row label="Học kỳ" value={period.Semester} />
              <Row label="Năm học" value={period.AcademicYear} />
              <Row label="Trạng thái" value={
                <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${status.cls}`}>
                  {status.label}
                </span>
              } />
              <Row label="Ngày bắt đầu" value={new Date(period.StartDate).toLocaleDateString("vi-VN")} />
              <Row label="Ngày kết thúc" value={new Date(period.EndDate).toLocaleDateString("vi-VN")} />
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-200">
              <div className="spinner-blue"></div>
              <p className="mt-4 text-slate-500 font-medium">Đang tải thống kê...</p>
            </div>
          ) : stats && (
            <>
              {/* Thống kê Tổng quan */}
              <div>
                <h4 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-indigo-500 rounded-full"></span>
                  Thống kê tổng quan
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <StatCard title="Sinh viên tham gia" value={stats.totalStudents} color="blue" icon={Users} />
                  <StatCard title="Giảng viên hướng dẫn" value={stats.totalLecturers} color="purple" icon={GraduationCap} />
                  <StatCard title="Công ty tiếp nhận" value={stats.totalCompanies} color="amber" icon={Building2} />
                </div>
              </div>

              {/* Tiến độ */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-end mb-4">
                  <h4 className="text-base font-bold text-slate-800 flex items-center gap-2 m-0">
                    <span className="w-1.5 h-6 bg-emerald-500 rounded-full"></span>
                    Tiến độ hoàn thành
                  </h4>
                  <div className="text-3xl font-black text-emerald-500 leading-none">{stats.completionRate}%</div>
                </div>
                
                <div className="w-full bg-slate-100 rounded-full h-4 mb-5 overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${stats.completionRate}%` }}></div>
                </div>
                
                <div className="flex flex-wrap gap-4 mt-2">
                  <div className="flex items-center gap-2 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-100 flex-1 justify-center min-w-[120px]">
                    <CheckCircle2 size={18} className="text-emerald-600" />
                    <div className="text-sm">
                      <span className="text-slate-500 font-medium mr-1">Hoàn thành:</span>
                      <strong className="text-emerald-700 text-lg">{stats.completed}</strong>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg border border-blue-100 flex-1 justify-center min-w-[120px]">
                    <Clock size={18} className="text-blue-600" />
                    <div className="text-sm">
                      <span className="text-slate-500 font-medium mr-1">Đang thực tập:</span>
                      <strong className="text-blue-700 text-lg">{stats.inProgress}</strong>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-100 px-3 py-2 rounded-lg border border-slate-200 flex-1 justify-center min-w-[120px]">
                    <AlertCircle size={18} className="text-slate-500" />
                    <div className="text-sm">
                      <span className="text-slate-500 font-medium mr-1">Chưa bắt đầu:</span>
                      <strong className="text-slate-700 text-lg">{stats.notStarted}</strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Giảng viên hướng dẫn */}
                <div>
                  <h4 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-purple-500 rounded-full"></span>
                    Giảng viên hướng dẫn
                  </h4>
                  {lecturers.length === 0 ? (
                    <div className="bg-white p-6 border border-slate-200 rounded-2xl text-center text-slate-500">
                      Chưa có giảng viên nào được phân công.
                    </div>
                  ) : (
                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm max-h-[400px] overflow-y-auto">
                      <div className="flex flex-col divide-y divide-slate-100">
                        {lecturers.map((l, i) => (
                          <div key={l.LecturerId} className="p-4 hover:bg-slate-50 flex items-center justify-between gap-4 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-lg flex-shrink-0">
                                {l.FullName.charAt(0)}
                              </div>
                              <div>
                                <div className="font-bold text-slate-800">{l.FullName}</div>
                                <div className="text-xs font-semibold text-slate-400 mt-0.5">{l.LecturerCode}</div>
                              </div>
                            </div>
                            <div className="bg-purple-50 text-purple-700 px-3 py-1.5 rounded-lg text-sm font-bold border border-purple-100 whitespace-nowrap">
                              {l.StudentCount} SV
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Công ty tiếp nhận */}
                <div>
                  <h4 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-amber-500 rounded-full"></span>
                    Công ty tiếp nhận
                  </h4>
                  {companies.length === 0 ? (
                    <div className="bg-white p-6 border border-slate-200 rounded-2xl text-center text-slate-500">
                      Chưa có sinh viên đăng ký công ty trong đợt này.
                    </div>
                  ) : (
                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm max-h-[400px] overflow-y-auto">
                      <div className="flex flex-col divide-y divide-slate-100">
                        {companies.map((c, i) => (
                          <div key={c.CompanyId} className="p-4 hover:bg-slate-50 flex items-center justify-between gap-4 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
                                <Building2 size={20} />
                              </div>
                              <div className="font-bold text-slate-800 line-clamp-2">{c.CompanyName}</div>
                            </div>
                            <div className="bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg text-sm font-bold border border-amber-100 whitespace-nowrap">
                              {c.StudentCount} SV
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PeriodDetailModal;
