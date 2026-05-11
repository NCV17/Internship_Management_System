import { useState, useEffect } from "react";
import { companyAPI } from "../../services/api";
import { useToast } from "../../context/ToastContext";
import { Building2, Users, CalendarDays, MapPin, Mail, Phone, Briefcase, CheckCircle2, Clock, AlertCircle } from "lucide-react";

const STATUS_MAP = {
  NOT_STARTED: { label: "Chưa bắt đầu", cls: "bg-slate-100 text-slate-700 border-slate-200" },
  IN_PROGRESS:  { label: "Đang thực tập", cls: "bg-blue-100 text-blue-700 border-blue-200" },
  COMPLETED:    { label: "Hoàn thành",    cls: "bg-emerald-100 text-emerald-700 border-emerald-200" },
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
      <div className={`w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center ${c.text} flex-shrink-0`}>
        <Icon size={24} strokeWidth={2} />
      </div>
      <div>
        <div className="text-3xl font-black text-slate-800 leading-none mb-1">{value}</div>
        <div className="text-sm font-semibold text-slate-500">{title}</div>
      </div>
    </div>
  );
};

const Row = ({ label, value, icon: Icon }) => (
  <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
    {Icon && <Icon className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />}
    <div>
      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{label}</div>
      <div className="text-sm font-medium text-slate-800">{value || <span className="text-slate-400 italic font-normal">Chưa cập nhật</span>}</div>
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
        setPeriods(res.data.data.periods || []);
        setStudents(res.data.data.students || []);
      } catch (err) {
        toast.error("Không thể tải dữ liệu thống kê.");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [company.CompanyId, periodId, toast]);

  // Company status checking (fallback to active if IsActive is missing)
  const isCompanyActive = company.IsActive !== false && company.IsActive !== 0;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ padding: "20px" }}>
      <div className="modal-box" style={{ maxWidth: "1000px", width: "100%", maxHeight: "calc(100vh - 40px)", display: "flex", flexDirection: "column", borderRadius: "20px" }} onClick={e => e.stopPropagation()}>
        
        <div className="modal-header" style={{ padding: "24px 32px", borderBottom: "1px solid var(--border)" }}>
          <div className="modal-title-group" style={{ gap: "16px" }}>
            <span className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Building2 size={24} />
            </span>
            <div>
              <h2 className="modal-title" style={{ fontSize: "22px" }}>Hồ sơ Công ty Thực tập</h2>
              <p className="modal-subtitle" style={{ fontSize: "15px", marginTop: "4px" }}>Xem chi tiết và thống kê</p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose} style={{ background: "var(--bg-page)" }}>✕</button>
        </div>

        <div className="modal-body" style={{ overflowY: "auto", padding: "32px", background: "#f8fafc", display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* Header Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-start gap-6">
            <div className="w-24 h-24 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shadow-sm flex-shrink-0 border border-amber-200">
              <Building2 size={48} strokeWidth={1.5} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-2">
                <h3 className="text-2xl font-bold text-slate-800">{company.CompanyName}</h3>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold border uppercase tracking-wide ${isCompanyActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"}`}>
                  {isCompanyActive ? "● Đang hợp tác" : "● Tạm ngưng"}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 mt-4">
                <div className="flex items-center gap-2 text-sm text-slate-600"><MapPin size={18} className="text-slate-400" /> <span className="font-medium text-slate-800">{company.Address}</span></div>
                <div className="flex items-center gap-2 text-sm text-slate-600"><Briefcase size={18} className="text-slate-400" /> <span className="font-medium text-slate-800">{company.Field}</span></div>
                <div className="flex items-center gap-2 text-sm text-slate-600"><Mail size={18} className="text-slate-400" /> <span className="font-medium text-slate-800">{company.ContactEmail}</span></div>
                <div className="flex items-center gap-2 text-sm text-slate-600"><Phone size={18} className="text-slate-400" /> <span className="font-medium text-slate-800">{company.ContactPhone}</span></div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <div className="spinner-blue"></div>
              <p className="mt-4 text-slate-500 font-medium">Đang tải thống kê...</p>
            </div>
          ) : stats && (
            <>
              {/* Thống kê Tổng quan */}
              <div>
                <h4 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-indigo-500 rounded-full"></span>
                  Thống kê tổng quan {periodId ? <span className="text-sm font-semibold text-slate-500 ml-2">(Lọc theo đợt)</span> : <span className="text-sm font-semibold text-slate-500 ml-2">(Tất cả các đợt)</span>}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <StatCard title="Tổng SV tiếp nhận" value={stats.totalStudents} color="blue" icon={Users} />
                  <StatCard title="Số đợt tham gia" value={stats.totalPeriods} color="purple" icon={CalendarDays} />
                </div>
              </div>

              {/* Tiến độ */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-end mb-4">
                  <h4 className="text-base font-bold text-slate-800 flex items-center gap-2 m-0">
                    <span className="w-1.5 h-6 bg-emerald-500 rounded-full"></span>
                    Tiến độ thực tập của Sinh viên
                  </h4>
                  <div className="text-3xl font-black text-emerald-500 leading-none">{stats.completionRate}%</div>
                </div>
                
                <div className="w-full bg-slate-100 rounded-full h-3 mb-5 overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${stats.completionRate}%` }}></div>
                </div>
                
                <div className="flex flex-wrap items-center gap-3 mt-2">
                  <div className="flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded border border-emerald-100">
                    <CheckCircle2 size={16} className="text-emerald-600" />
                    <div className="text-sm flex items-baseline gap-1">
                      <span className="text-emerald-600 font-medium">Hoàn thành:</span>
                      <strong className="text-emerald-700 text-base">{stats.completed}</strong>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 bg-blue-50 px-3 py-1.5 rounded border border-blue-100">
                    <Clock size={16} className="text-blue-600" />
                    <div className="text-sm flex items-baseline gap-1">
                      <span className="text-blue-600 font-medium">Đang thực tập:</span>
                      <strong className="text-blue-700 text-base">{stats.inProgress}</strong>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded border border-slate-200">
                    <AlertCircle size={16} className="text-slate-500" />
                    <div className="text-sm flex items-baseline gap-1">
                      <span className="text-slate-600 font-medium">Chưa bắt đầu:</span>
                      <strong className="text-slate-700 text-base">{stats.notStarted}</strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Các đợt tham gia */}
                {!periodId && (
                  <div className="flex flex-col">
                    <h4 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <span className="w-1.5 h-6 bg-purple-500 rounded-full"></span>
                      Các đợt thực tập đã tham gia
                    </h4>
                    {periods.length === 0 ? (
                      <div className="bg-white flex-1 p-6 border border-slate-200 rounded-2xl text-center text-slate-500 flex items-center justify-center">
                        Chưa tham gia đợt thực tập nào.
                      </div>
                    ) : (
                      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex-1 max-h-[400px] overflow-y-auto">
                        <div className="flex flex-col divide-y divide-slate-100">
                          {periods.map((p) => (
                            <div key={p.PeriodId} className="p-4 hover:bg-slate-50 flex flex-col gap-1 transition-colors">
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-slate-800 text-sm">{p.PeriodName}</span>
                                <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-bold border border-blue-100 whitespace-nowrap">
                                  {p.StudentCount} SV
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 mt-1">
                                <CalendarDays size={14} /> Học kỳ {p.Semester} • Năm học {p.AcademicYear}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Danh sách sinh viên */}
                <div className={`flex flex-col ${periodId ? "col-span-2" : ""}`}>
                  <h4 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-blue-500 rounded-full"></span>
                    Danh sách Sinh viên đang thực tập
                  </h4>
                  {students.length === 0 ? (
                    <div className="bg-white flex-1 p-6 border border-slate-200 rounded-2xl text-center text-slate-500 flex items-center justify-center">
                      Chưa có sinh viên nào thực tập tại công ty này.
                    </div>
                  ) : (
                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex-1 max-h-[400px] overflow-y-auto">
                      <div className="flex flex-col divide-y divide-slate-100">
                        {students.map((s) => {
                          const status = STATUS_MAP[s.InternshipStatus] || STATUS_MAP["NOT_STARTED"];
                          return (
                            <div key={s.StudentId} className="p-3 hover:bg-slate-50 flex items-center justify-between gap-3 transition-colors">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                                  {s.FullName.charAt(0)}
                                </div>
                                <div>
                                  <div className="font-bold text-slate-800 text-sm">{s.FullName}</div>
                                  <div className="flex flex-wrap items-center gap-1 mt-0.5 text-xs text-slate-500">
                                    <span className="font-semibold text-blue-600 bg-blue-50 px-1 rounded">{s.StudentCode}</span>
                                    {s.LecturerName && <span>• GV: {s.LecturerName}</span>}
                                  </div>
                                </div>
                              </div>
                              <div className="flex flex-col items-end flex-shrink-0">
                                <span className={`inline-flex px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${status.cls}`}>
                                  {status.label}
                                </span>
                              </div>
                            </div>
                          );
                        })}
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

export default CompanyDetailModal;
