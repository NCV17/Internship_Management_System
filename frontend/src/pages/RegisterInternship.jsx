import { useState, useEffect, useMemo } from "react";
import { studentInternshipAPI } from "../services/api";
import { useToast } from "../context/ToastContext";
import {
  CalendarDays, Building2, MapPin, User, Phone, Mail,
  CheckCircle2, AlertTriangle, Search, Loader2, Lock,
  Info, ChevronDown, Check, Send, Clock, BadgeCheck,
} from "lucide-react";

/* ════════════════════════════════════════════════════════════════════════════
   HELPERS
   ════════════════════════════════════════════════════════════════════════════ */
const initials = (name = "") => {
  const w = name.trim().split(/\s+/);
  return w.length >= 2 ? (w[0][0] + w[1][0]).toUpperCase() : name.slice(0, 2).toUpperCase() || "C";
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString("vi-VN") : "—";

/* ════════════════════════════════════════════════════════════════════════════
   SUB-COMPONENTS
   ════════════════════════════════════════════════════════════════════════════ */

/* ── PeriodInfoCard ─────────────────────────────────────────────────────── */
const PeriodInfoCard = ({ period }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-7 py-5">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2.5">
        <CalendarDays size={18} className="text-blue-600" />
        <span className="text-[15px] font-bold text-slate-800">Đợt thực tập đang mở</span>
      </div>
      {period && (
        <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 uppercase tracking-wider border border-emerald-100">
          Đang mở
        </span>
      )}
    </div>

    {period ? (
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-6 border-t border-gray-50 pt-4">
        {[
          { label: "Tên đợt",  val: period.PeriodName },
          { label: "Học kỳ",   val: `HK Học kỳ ${period.Semester}` },
          { label: "Năm học",  val: period.AcademicYear },
          { label: "Bắt đầu",  val: fmtDate(period.StartDate) },
          { label: "Kết thúc", val: fmtDate(period.EndDate) },
        ].map(({ label, val }) => (
          <div key={label}>
            <p className="text-[11px] text-gray-400 font-medium mb-1">{label}</p>
            <p className="text-[13px] font-bold text-slate-800">{val}</p>
          </div>
        ))}
      </div>
    ) : (
      <div className="flex items-center gap-2 pt-2 text-gray-400 text-sm">
        <AlertTriangle size={16} />
        <span>Hiện chưa có đợt thực tập đang mở.</span>
      </div>
    )}
  </div>
);

/* ── CompanyCard – card trong grid chọn công ty ─────────────────────────── */
const CompanyCard = ({ company, isSelected, onSelect, onRegister, submitting }) => (
  <div
    onClick={() => onSelect(company.CompanyId)}
    className={`relative bg-white rounded-2xl border-2 shadow-sm cursor-pointer transition-all duration-150 overflow-hidden group
      ${isSelected
        ? "border-blue-500 shadow-blue-100 shadow-md"
        : "border-gray-100 hover:border-blue-200 hover:shadow-md"}`}
  >
    {/* selected indicator */}
    {isSelected && (
      <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
        <Check size={13} className="text-white" />
      </div>
    )}

    <div className="p-5">
      {/* logo + name */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className={`rounded-xl font-bold text-[15px] flex items-center justify-center flex-shrink-0 transition-colors
            ${isSelected ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white"}`}
          style={{ width: 46, height: 46 }}
        >
          {initials(company.CompanyName)}
        </div>
        <div className="min-w-0">
          <p className="text-[14px] font-bold text-slate-800 truncate leading-snug">{company.CompanyName}</p>
          {company.Field && (
            <span className="inline-block mt-1 px-2 py-0.5 bg-blue-50 text-blue-600 text-[11px] font-semibold rounded">
              {company.Field}
            </span>
          )}
        </div>
      </div>

      {/* address */}
      {company.Address && (
        <div className="flex items-center gap-1.5 text-[12px] text-gray-400 mb-3">
          <MapPin size={12} className="flex-shrink-0" />
          <span className="truncate">{company.Address}</span>
        </div>
      )}

      {/* contact */}
      {company.ContactPerson && (
        <div className="flex items-center gap-1.5 text-[12px] text-gray-400 mb-4">
          <User size={12} className="flex-shrink-0" />
          <span className="truncate">{company.ContactPerson}</span>
        </div>
      )}
    </div>

    {/* register button – full-width footer */}
    <button
      onClick={(e) => { e.stopPropagation(); onSelect(company.CompanyId); onRegister(); }}
      disabled={submitting && isSelected}
      className={`w-full py-3 text-[13px] font-bold flex items-center justify-center gap-1.5 transition-colors border-t
        ${isSelected
          ? "bg-blue-600 text-white hover:bg-blue-700 border-blue-500"
          : "bg-gray-50 text-gray-500 hover:bg-blue-50 hover:text-blue-600 border-gray-100"}`}
    >
      {submitting && isSelected
        ? <><Loader2 size={14} className="animate-spin" />Đang xử lý…</>
        : <><Send size={13} />Đăng ký</>}
    </button>
  </div>
);

/* ── RegisteredCompanyCard ──────────────────────────────────────────────── */
const RegisteredCompanyCard = ({ reg, assignment }) => {
  const isAssigned = !!assignment;
  const rows = [
    { icon: Building2, label: "Lĩnh vực",       value: reg.Field },
    { icon: MapPin,    label: "Địa chỉ",         value: reg.Address },
    { icon: User,      label: "Người liên hệ",   value: reg.ContactPerson },
    { icon: Mail,      label: "Email liên hệ",   value: reg.ContactEmail },
    { icon: Phone,     label: "Điện thoại",       value: reg.ContactPhone },
    { icon: CalendarDays, label: "Ngày đăng ký", value: fmtDate(reg.RegisteredAt) },
    { icon: Clock,     label: "Đợt thực tập",    value: reg.PeriodName },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* success banner */}
      <div className="flex items-center gap-3 px-6 py-4 bg-emerald-500">
        <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
          <BadgeCheck size={20} className="text-white" />
        </div>
        <div>
          <p className="text-[13px] font-bold text-white">Đăng ký thực tập thành công</p>
          <p className="text-[12px] text-emerald-100 mt-0.5">
            {isAssigned
              ? <>Đã được phân công giảng viên hướng dẫn: <strong>{assignment.LecturerName}</strong>.</>
              : "Đã ghi nhận đăng ký. Chờ admin phân công giảng viên hướng dẫn."}
          </p>
        </div>
      </div>

      {/* company identity */}
      <div className="px-6 py-5 flex items-center gap-4 border-b border-gray-50">
        <div
          className="rounded-2xl bg-blue-600 text-white font-bold flex items-center justify-center flex-shrink-0"
          style={{ width: 60, height: 60, fontSize: 20 }}
        >
          {initials(reg.CompanyName)}
        </div>
        <div>
          <p className="text-[18px] font-bold text-slate-800 leading-snug">{reg.CompanyName}</p>
          {reg.Field && (
            <span className="inline-block mt-1.5 px-2.5 py-0.5 bg-blue-50 text-blue-600 text-[12px] font-semibold rounded-full">
              {reg.Field}
            </span>
          )}
        </div>
        {/* status badge */}
        <div className="ml-auto flex-shrink-0">
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[12px] font-bold">
            <CheckCircle2 size={14} />
            Đã đăng ký
          </span>
        </div>
      </div>

      {/* detail grid */}
      <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {rows.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Icon size={15} className="text-slate-400" />
            </div>
            <div>
              <p className="text-[11px] text-gray-400 font-medium mb-0.5">{label}</p>
              <p className="text-[13px] font-semibold text-slate-800">{value || "—"}</p>
            </div>
          </div>
        ))}
      </div>

      {/* footer note */}
      <div className="px-6 py-3 bg-amber-50/60 border-t border-amber-100 flex items-center gap-2 text-[12px] text-amber-700">
        <Lock size={13} className="flex-shrink-0" />
        Sau khi đăng ký thành công, bạn không thể thay đổi công ty thực tập.
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   MAIN PAGE
   ════════════════════════════════════════════════════════════════════════════ */
const RegisterInternship = () => {
  const toast = useToast();

  const [loading, setLoading]       = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [period, setPeriod]               = useState(null);
  const [companies, setCompanies]         = useState([]);
  const [registration, setRegistration]   = useState(null);
  const [assignment, setAssignment]       = useState(null);

  const [selectedCompanyId, setSelectedCompanyId] = useState(null);
  const [searchTerm, setSearchTerm]   = useState("");
  const [fieldFilter, setFieldFilter] = useState("");

  /* fetch */
  useEffect(() => {
    (async () => {
      try {
        const [pRes, cRes, rRes] = await Promise.all([
          studentInternshipAPI.getOpenPeriod(),
          studentInternshipAPI.getCompanies(),
          studentInternshipAPI.getMyRegistration(),
        ]);
        setPeriod(pRes.data.data);
        setCompanies(cRes.data.data || []);
        setRegistration(rRes.data.data?.registration || null);
        setAssignment(rRes.data.data?.assignment || null);
      } catch {
        toast.error("Không thể tải dữ liệu.");
      } finally {
        setLoading(false);
      }
    })();
  }, [toast]);

  /* submit */
  const handleRegister = async (companyId) => {
    const target = companyId || selectedCompanyId;
    if (!target) { toast.warning("Vui lòng chọn công ty."); return; }
    if (target !== selectedCompanyId) setSelectedCompanyId(target);
    try {
      setSubmitting(true);
      await studentInternshipAPI.registerInternship({ companyId: target });
      toast.success("Đăng ký thực tập thành công!");
      const rRes = await studentInternshipAPI.getMyRegistration();
      setRegistration(rRes.data.data?.registration || null);
      setAssignment(rRes.data.data?.assignment || null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Đăng ký thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  /* derived */
  const fields = useMemo(() => {
    const s = new Set(companies.map(c => c.Field).filter(Boolean));
    return [...s].sort();
  }, [companies]);

  const filtered = useMemo(() => companies.filter(c => {
    const name  = c.CompanyName.toLowerCase().includes(searchTerm.toLowerCase());
    const field = !fieldFilter || c.Field === fieldFilter;
    return name && field;
  }), [companies, searchTerm, fieldFilter]);

  const isLocked     = !!assignment;
  const isRegistered = !!registration;

  /* ── Loading ── */
  if (loading) return (
    <>
      <div className="topbar">
        <div>
          <div className="topbar-title">Đăng ký thực tập</div>
          <div className="topbar-subtitle">Chọn công ty thực tập cho đợt thực tập hiện tại</div>
        </div>
      </div>
      <div className="page-content flex justify-center items-center py-40">
        <Loader2 size={32} className="animate-spin text-blue-500" />
      </div>
    </>
  );

  return (
    <>
      {/* TOPBAR */}
      <div className="topbar">
        <div>
          <div className="topbar-title">Đăng ký thực tập</div>
          <div className="topbar-subtitle">Chọn công ty thực tập cho đợt thực tập hiện tại</div>
        </div>
      </div>

      {/* PAGE */}
      <div className="page-content bg-[#f4f6f9] min-h-[calc(100vh-73px)] px-6 py-6">
        <div className="max-w-[1100px] mx-auto space-y-5">

          {/* LOCK BANNER */}
          {isLocked && (
            <div className="flex items-center gap-3 px-5 py-3.5 bg-amber-50 border border-amber-200 rounded-xl">
              <Lock size={17} className="text-amber-600 flex-shrink-0" />
              <p className="text-[13px] text-amber-800">
                Bạn đã được phân công giảng viên hướng dẫn: <strong>{assignment.LecturerName}</strong>. Không thể thay đổi công ty.
              </p>
            </div>
          )}

          {/* 1. PERIOD CARD */}
          <PeriodInfoCard period={period} />

          {/* ── REGISTERED STATE ────────────────────────────────────────── */}
          {isRegistered ? (
            <RegisteredCompanyCard reg={registration} assignment={assignment} />
          ) : (
            <>
              {/* 2. INFO NOTICE */}
              {period && (
                <div className="flex items-center gap-3 px-5 py-3 bg-blue-50 border border-blue-100 rounded-xl">
                  <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                    <Info size={13} className="text-white" />
                  </div>
                  <p className="text-[13px] text-blue-800">
                    Bạn chỉ được đăng ký <strong>1 công ty</strong> cho mỗi đợt thực tập. Hệ thống sẽ tự động chấp nhận đăng ký.
                  </p>
                </div>
              )}

              {/* 3. COMPANY GRID */}
              {period && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  {/* grid header / search */}
                  <div className="px-6 pt-5 pb-4 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex items-center gap-2 flex-1">
                      <Building2 size={17} className="text-blue-600" />
                      <span className="text-[15px] font-bold text-slate-800">Chọn công ty thực tập</span>
                    </div>
                    <div className="flex gap-2.5">
                      {/* search */}
                      <div className="relative">
                        <Search size={14} className="absolute top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" style={{ left: "10px" }} />
                        <input
                          type="text"
                          placeholder="Tìm kiếm công ty..."
                          value={searchTerm}
                          onChange={e => setSearchTerm(e.target.value)}
                          className="text-[13px] border border-gray-200 rounded-lg py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-56"
                          style={{ paddingLeft: "2rem", paddingRight: "0.75rem" }}
                        />
                      </div>
                      {/* filter */}
                      <div className="relative">
                        <select
                          value={fieldFilter}
                          onChange={e => setFieldFilter(e.target.value)}
                          className="text-[13px] border border-gray-200 rounded-lg py-2 pl-3 pr-8 bg-white focus:outline-none focus:border-blue-500 cursor-pointer text-gray-600 appearance-none"
                        >
                          <option value="">Tất cả lĩnh vực</option>
                          {fields.map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                        <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {/* grid */}
                  <div className="p-6">
                    {filtered.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center mb-3">
                          <Building2 size={24} className="text-gray-300" />
                        </div>
                        <p className="text-sm text-gray-400">Không tìm thấy công ty nào.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filtered.map(c => (
                          <CompanyCard
                            key={c.CompanyId}
                            company={c}
                            isSelected={selectedCompanyId === c.CompanyId}
                            onSelect={setSelectedCompanyId}
                            onRegister={() => handleRegister(c.CompanyId)}
                            submitting={submitting}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </>
  );
};

export default RegisterInternship;
