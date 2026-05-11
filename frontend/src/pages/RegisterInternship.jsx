import { useState, useEffect, useMemo } from "react";
import { studentInternshipAPI } from "../services/api";
import { useToast } from "../context/ToastContext";

const initials = (name = "") => {
  const w = name.trim().split(/\s+/);
  return (w.length >= 2 ? w[0][0] + w[w.length - 1][0] : name.slice(0, 2)).toUpperCase() || "C";
};
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("vi-VN") : "—";

// ─── Period Info Banner ───────────────────────────────────────────────────────
const PeriodBanner = ({ period }) => (
  <div style={{ background: "var(--bg-card)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)", padding: "20px 24px" }}>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: period ? 16 : 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: 8, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>📅</div>
        <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>Đợt thực tập đang mở</span>
      </div>
      {period && (
        <span style={{ background: "#dcfce7", color: "#166534", fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 20, border: "1px solid #bbf7d0" }}>ĐANG MỞ</span>
      )}
    </div>
    {period ? (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16, borderTop: "1px solid var(--border)", paddingTop: 16 }}>
        {[
          { label: "Tên đợt", val: period.PeriodName },
          { label: "Học kỳ", val: `HK Học kỳ ${period.Semester}` },
          { label: "Năm học", val: period.AcademicYear },
          { label: "Bắt đầu", val: fmtDate(period.StartDate) },
          { label: "Kết thúc", val: fmtDate(period.EndDate) },
        ].map(({ label, val }) => (
          <div key={label}>
            <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{val}</div>
          </div>
        ))}
      </div>
    ) : (
      <div style={{ color: "var(--text-muted)", fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
        ⚠️ Hiện chưa có đợt thực tập đang mở.
      </div>
    )}
  </div>
);

// ─── Company Selector Card ────────────────────────────────────────────────────
const CompanyCard = ({ company, isSelected, onSelect, onRegister, submitting }) => (
  <div
    onClick={() => onSelect(company.CompanyId)}
    style={{
      background: "white",
      borderRadius: "var(--radius-lg)",
      border: `2px solid ${isSelected ? "var(--primary)" : "var(--border)"}`,
      boxShadow: isSelected ? "0 4px 16px rgba(59,130,246,0.15)" : "var(--shadow-sm)",
      cursor: "pointer",
      transition: "all 0.18s",
      overflow: "hidden",
      position: "relative",
    }}
    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.borderColor = "#93c5fd"; }}
    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.borderColor = "var(--border)"; }}
  >
    {isSelected && (
      <div style={{ position: "absolute", top: 12, right: 12, width: 24, height: 24, borderRadius: "50%", background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 14, fontWeight: 700 }}>✓</div>
    )}
    <div style={{ padding: "18px 18px 14px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <div style={{ width: 46, height: 46, borderRadius: 12, background: isSelected ? "var(--primary)" : "#eff6ff", color: isSelected ? "white" : "var(--primary)", fontSize: 15, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.18s" }}>
          {initials(company.CompanyName)}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{company.CompanyName}</div>
          {company.Field && <span style={{ background: "#eff6ff", color: "var(--primary)", fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 6, marginTop: 4, display: "inline-block" }}>{company.Field}</span>}
        </div>
      </div>
      {company.Address && (
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {company.Address}
        </div>
      )}
      {company.ContactPerson && (
        <div style={{ fontSize: 12, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {company.ContactPerson}
        </div>
      )}
    </div>
    <button
      onClick={(e) => { e.stopPropagation(); onSelect(company.CompanyId); onRegister(); }}
      disabled={submitting && isSelected}
      style={{
        width: "100%",
        padding: "12px",
        borderTop: `1px solid ${isSelected ? "var(--primary)" : "var(--border)"}`,
        background: isSelected ? "var(--primary)" : "#f8fafc",
        color: isSelected ? "white" : "var(--text-secondary)",
        fontWeight: 700,
        fontSize: 13,
        cursor: "pointer",
        border: "none",
        transition: "all 0.18s",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
      }}
    >
      {submitting && isSelected ? "⏳ Đang xử lý…" : "📨 Đăng ký"}
    </button>
  </div>
);

// ─── Registered Company View ──────────────────────────────────────────────────
const RegisteredView = ({ reg, assignment }) => {
  const isAssigned = !!assignment;
  const rows = [
    { label: "Lĩnh vực", value: reg.Field },
    { label: "Địa chỉ", value: reg.Address },
    { label: "Người liên hệ", value: reg.ContactPerson },
    { label: "Email liên hệ", value: reg.ContactEmail },
    { label: "Điện thoại", value: reg.ContactPhone },
    { label: "Ngày đăng ký", value: fmtDate(reg.RegisteredAt) },
    { label: "Đợt thực tập", value: reg.PeriodName },
  ];

  return (
    <div style={{ background: "var(--bg-card)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)", overflow: "hidden" }}>
      {/* Success Banner */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 24px", background: "linear-gradient(135deg, #059669, #10b981)" }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>✅</div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "white" }}>Đăng ký thực tập thành công</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", marginTop: 2 }}>
            {isAssigned ? <>Đã được phân công giảng viên hướng dẫn: <strong>{assignment.LecturerName}</strong>.</> : "Đã ghi nhận đăng ký. Chờ admin phân công giảng viên."}
          </div>
        </div>
      </div>

      {/* Company Identity */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "20px 24px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ width: 60, height: 60, borderRadius: 14, background: "var(--primary)", color: "white", fontWeight: 700, fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {initials(reg.CompanyName)}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>{reg.CompanyName}</div>
          {reg.Field && <span style={{ background: "#eff6ff", color: "var(--primary)", fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 20 }}>{reg.Field}</span>}
        </div>
        <span style={{ display: "flex", alignItems: "center", gap: 6, background: "#dcfce7", color: "#166534", fontSize: 12, fontWeight: 700, padding: "6px 14px", borderRadius: 20, border: "1px solid #bbf7d0", flexShrink: 0 }}>
          ✓ Đã đăng ký
        </span>
      </div>

      {/* Detail Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0, padding: "4px 0" }}>
        {rows.map(({ label, value }) => (
          <div key={label} style={{ padding: "14px 24px", borderBottom: "1px solid #f8fafc" }}>
            <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.4px" }}>{label}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{value || "—"}</div>
          </div>
        ))}
      </div>

      {/* Footer note */}
      <div style={{ padding: "12px 24px", background: "#fffbeb", borderTop: "1px solid #fde68a", display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#92400e" }}>
        🔒 Sau khi đăng ký thành công, bạn không thể thay đổi công ty thực tập.
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const RegisterInternship = () => {
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [period, setPeriod] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [registration, setRegistration] = useState(null);
  const [assignment, setAssignment] = useState(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [fieldFilter, setFieldFilter] = useState("");

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

  const fields = useMemo(() => {
    const s = new Set(companies.map(c => c.Field).filter(Boolean));
    return [...s].sort();
  }, [companies]);

  const filtered = useMemo(() => companies.filter(c => {
    const name = c.CompanyName.toLowerCase().includes(searchTerm.toLowerCase());
    const field = !fieldFilter || c.Field === fieldFilter;
    return name && field;
  }), [companies, searchTerm, fieldFilter]);

  const isLocked = !!assignment;
  const isRegistered = !!registration;

  if (loading) return (
    <>
      <div className="topbar"><div><div className="topbar-title">Đăng ký thực tập</div><div className="topbar-subtitle">Chọn công ty thực tập cho đợt thực tập hiện tại</div></div></div>
      <div className="page-content" style={{ display: "flex", justifyContent: "center", alignItems: "center" }}><div className="spinner" /></div>
    </>
  );

  return (
    <>
      <div className="topbar">
        <div>
          <div className="topbar-title">Đăng ký thực tập</div>
          <div className="topbar-subtitle">Chọn công ty thực tập cho đợt thực tập hiện tại</div>
        </div>
      </div>

      <div className="page-content">
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Lock banner */}
          {isLocked && (
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 20px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "var(--radius-lg)", fontSize: 13, color: "#92400e" }}>
              🔒 <span>Bạn đã được phân công giảng viên hướng dẫn: <strong>{assignment.LecturerName}</strong>. Không thể thay đổi công ty.</span>
            </div>
          )}

          {/* Period info */}
          <PeriodBanner period={period} />

          {/* Registered state */}
          {isRegistered ? (
            <RegisteredView reg={registration} assignment={assignment} />
          ) : (
            <>
              {/* Info notice */}
              {period && (
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 20px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "var(--radius-lg)", fontSize: 13, color: "#1d4ed8" }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>ℹ</div>
                  Bạn chỉ được đăng ký <strong style={{ marginLeft: 4 }}>1 công ty</strong> cho mỗi đợt thực tập. Hệ thống sẽ tự động chấp nhận đăng ký.
                </div>
              )}

              {/* Company grid */}
              {period && (
                <div style={{ background: "var(--bg-card)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)", overflow: "hidden" }}>
                  {/* Header + search */}
                  <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, background: "#f8fafc" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 8, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🏢</div>
                      <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>Chọn công ty thực tập</span>
                    </div>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <div style={{ position: "relative" }}>
                        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14 }}>🔍</span>
                        <input
                          type="text"
                          placeholder="Tìm kiếm công ty..."
                          value={searchTerm}
                          onChange={e => setSearchTerm(e.target.value)}
                          style={{ paddingLeft: 36, paddingRight: 12, height: 38, fontSize: 13, border: "1px solid var(--border)", borderRadius: 8, outline: "none", width: 220, background: "white" }}
                        />
                      </div>
                      <select
                        value={fieldFilter}
                        onChange={e => setFieldFilter(e.target.value)}
                        style={{ height: 38, paddingLeft: 12, paddingRight: 12, fontSize: 13, border: "1px solid var(--border)", borderRadius: 8, outline: "none", background: "white", cursor: "pointer", color: "var(--text-secondary)" }}
                      >
                        <option value="">Tất cả lĩnh vực</option>
                        {fields.map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Grid */}
                  <div style={{ padding: 24 }}>
                    {filtered.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "48px 0", color: "var(--text-muted)" }}>
                        <div style={{ fontSize: 40, marginBottom: 12 }}>🏢</div>
                        <div style={{ fontSize: 14 }}>Không tìm thấy công ty nào.</div>
                      </div>
                    ) : (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
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
