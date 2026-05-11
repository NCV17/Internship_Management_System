import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { dashboardAPI } from "../services/api";
import { useToast } from "../context/ToastContext";
import {
  Users, GraduationCap, CalendarDays,
  AlertCircle, Activity, ChevronRight, FileText, CalendarPlus, UserPlus
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  ResponsiveContainer, Tooltip as RechartsTooltip,
} from "recharts";

/* ════════════════════════════════════════════════════════════════════════════
   HELPERS
   ════════════════════════════════════════════════════════════════════════════ */

const formatRelativeTime = (dateStr) => {
  if (!dateStr) return "";
  const ms = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return "Vừa xong";
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} ngày trước`;
  return new Date(dateStr).toLocaleDateString("vi-VN");
};

const activityIcon = (text = "") => {
  if (text.includes("đăng ký")) return "bg-blue-500";
  if (text.includes("phân công")) return "bg-indigo-500";
  if (text.includes("báo cáo tuần")) return "bg-teal-500";
  if (text.includes("báo cáo tổng")) return "bg-emerald-500";
  return "bg-gray-400";
};

/* ════════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════════════════════════════════════ */

const AdminDashboard = () => {
  const { user } = useAuth();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [lecturerWorkload, setLecturerWorkload] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [currentPeriod, setCurrentPeriod] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [ovRes, wlRes, actRes, perRes] = await Promise.all([
          dashboardAPI.getOverview(),
          dashboardAPI.getLecturerWorkload(),
          dashboardAPI.getRecentActivities(),
          dashboardAPI.getCurrentPeriod(),
        ]);
        setOverview(ovRes.data.data);
        setLecturerWorkload(wlRes.data.data || []);
        setRecentActivities(actRes.data.data || []);
        setCurrentPeriod(perRes.data.data);
      } catch {
        toast.error("Không thể tải dữ liệu bảng điều khiển.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="spinner"></div>
      </div>
    );
  }

  const unassignedCount = overview?.UnassignedStudents || 0;

  return (
    <>
      <div className="topbar">
        <div>
          <div className="topbar-title">Bảng điều khiển Quản trị</div>
          <div className="topbar-subtitle">
            {currentPeriod ? `Đợt hiện tại: ${currentPeriod.PeriodName} (HK${currentPeriod.Semester} - ${currentPeriod.AcademicYear})` : "Tổng quan hệ thống"}
          </div>
        </div>
        <span className="role-badge admin">QUẢN TRỊ VIÊN</span>
      </div>

      <div className="page-content">
        {/* 1. HERO CARD */}
        <div 
          className="welcome-card mb-6" 
          style={{
            background: "linear-gradient(135deg, #1e3a8a, #312e81, #4338ca)", // blue-900 to indigo-700
            color: "white",
            border: "none",
            borderRadius: "var(--radius-lg)",
            padding: "32px",
            boxShadow: "0 10px 25px rgba(30, 58, 138, 0.2)",
            position: "relative",
            overflow: "hidden"
          }}
        >
          {/* Background pattern */}
          <div style={{ position: "absolute", top: "-20%", right: "-5%", opacity: 0.1, transform: "scale(2)" }}>
            <svg width="200" height="200" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 14l9-5-9-5-9 5 9 5z" />
              <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
            </svg>
          </div>
          
          <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "20px" }}>
              <div>
                <h1 style={{ fontSize: "28px", fontWeight: 800, marginBottom: "8px", letterSpacing: "-0.5px" }}>
                  Xin chào, Administrator!
                </h1>
                <p style={{ fontSize: "15px", opacity: 0.9, maxWidth: "600px", margin: 0 }}>
                  Quản lý toàn bộ hệ thống thực tập. Theo dõi tiến độ, khối lượng công việc và hoạt động của giảng viên, sinh viên.
                </p>
              </div>
              
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <Link to="/admin/periods" className="btn-primary" style={{ width: "auto", background: "rgba(255,255,255,0.2)", backdropFilter: "blur(4px)", border: "1px solid rgba(255,255,255,0.3)", boxShadow: "none" }}>
                  <CalendarPlus className="w-5 h-5" />
                  Tạo đợt thực tập
                </Link>
                <Link to="/admin/assignments" className="btn-primary" style={{ width: "auto", background: "rgba(255,255,255,0.2)", backdropFilter: "blur(4px)", border: "1px solid rgba(255,255,255,0.3)", boxShadow: "none" }}>
                  <UserPlus className="w-5 h-5" />
                  Phân công GVHD
                </Link>
                <Link to="/admin/reports" className="btn-primary" style={{ width: "auto", background: "white", color: "#1e3a8a", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}>
                  <FileText className="w-5 h-5" />
                  Quản lý báo cáo
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* 2. WARNING CARD (if unassigned students exist) */}
        {unassignedCount > 0 && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                <AlertCircle size={20} />
              </div>
              <div>
                <h3 className="font-bold text-amber-800 m-0">Sinh viên chưa được phân công GVHD</h3>
                <p className="text-sm text-amber-700 m-0 mt-0.5">Có {unassignedCount} sinh viên đang chờ được phân công giảng viên hướng dẫn.</p>
              </div>
            </div>
            <Link to="/admin/assignments" className="btn-primary" style={{ background: "#d97706", width: "auto", padding: "8px 16px", fontSize: "14px" }}>
              Phân công ngay
            </Link>
          </div>
        )}

        {/* 3. STAT CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
          <div className="stat-card" style={{ padding: "20px" }}>
            <div className="stat-icon blue" style={{ width: "40px", height: "40px", marginBottom: "12px" }}>
              <Users size={20} />
            </div>
            <div className="stat-info">
              <div className="stat-number" style={{ fontSize: "24px" }}>{overview?.TotalStudents ?? 0}</div>
              <div className="stat-label">Tổng sinh viên</div>
            </div>
          </div>
          
          <div className="stat-card" style={{ padding: "20px" }}>
            <div className="stat-icon indigo" style={{ width: "40px", height: "40px", marginBottom: "12px" }}>
              <GraduationCap size={20} />
            </div>
            <div className="stat-info">
              <div className="stat-number" style={{ fontSize: "24px" }}>{overview?.TotalLecturers ?? 0}</div>
              <div className="stat-label">Tổng giảng viên</div>
            </div>
          </div>

          <div className="stat-card" style={{ padding: "20px" }}>
            <div className="stat-icon purple" style={{ width: "40px", height: "40px", marginBottom: "12px" }}>
              <CalendarDays size={20} />
            </div>
            <div className="stat-info">
              <div className="stat-number" style={{ fontSize: "24px" }}>{overview?.ActivePeriods ?? 0}</div>
              <div className="stat-label">Đợt đang mở</div>
            </div>
          </div>

          <div className="stat-card" style={{ padding: "20px" }}>
            <div className="stat-icon amber" style={{ width: "40px", height: "40px", marginBottom: "12px" }}>
              <AlertCircle size={20} />
            </div>
            <div className="stat-info">
              <div className="stat-number" style={{ fontSize: "24px" }}>{overview?.PendingReports ?? overview?.UnassignedStudents ?? 0}</div>
              <div className="stat-label">Báo cáo chờ duyệt</div>
            </div>
          </div>
        </div>

        {/* 4. MAIN LAYOUT */}
        <div style={{ display: "grid", gridTemplateColumns: "65% 1fr", gap: "24px", alignItems: "start" }}>
          
          {/* LEFT: WORKLOAD CHART */}
          <div style={{ background: "var(--bg-card)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)", overflow: "hidden" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>Khối lượng hướng dẫn giảng viên</h3>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "4px 0 0 0" }}>Số sinh viên được phân công theo giảng viên trong đợt hiện tại</p>
            </div>
            <div style={{ padding: "24px" }}>
              {lecturerWorkload.length === 0 ? (
                <div style={{ padding: "40px 0", textAlign: "center", color: "var(--text-muted)" }}>Chưa có dữ liệu phân công</div>
              ) : (
                <div style={{ height: "300px" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={lecturerWorkload.slice(0, 8)}
                      layout="vertical"
                      margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                      <XAxis
                        type="number"
                        tick={{ fill: "#94a3b8", fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                        allowDecimals={false}
                      />
                      <YAxis
                        dataKey="name"
                        type="category"
                        width={120}
                        tick={{ fill: "#64748b", fontSize: 13, fontWeight: 500 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <RechartsTooltip
                        cursor={{ fill: "#f8fafc" }}
                        contentStyle={{
                          borderRadius: "8px",
                          border: "1px solid #e2e8f0",
                          boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
                          fontSize: "13px",
                          fontWeight: 500
                        }}
                        formatter={(v) => [`${v} sinh viên`, "Phân công"]}
                      />
                      <Bar
                        dataKey="count"
                        fill="#4f46e5"
                        radius={[0, 4, 4, 0]}
                        barSize={16}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: RECENT ACTIVITIES */}
          <div style={{ background: "var(--bg-card)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)", overflow: "hidden" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "8px" }}>
              <Activity size={18} className="text-primary" />
              <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>Hoạt động gần đây</h3>
            </div>
            
            <div style={{ padding: "0" }}>
              {recentActivities.length === 0 ? (
                <div style={{ padding: "40px 0", textAlign: "center", color: "var(--text-muted)" }}>Chưa có hoạt động nào</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {recentActivities.slice(0, 6).map((item, idx) => (
                    <div key={idx} style={{ padding: "16px 24px", borderBottom: "1px solid var(--border)", display: "flex", gap: "16px", alignItems: "flex-start", background: idx % 2 === 0 ? "transparent" : "var(--bg-page)", transition: "background 0.2s" }} className="hover:bg-slate-50">
                      <div style={{ marginTop: "4px" }}>
                        <div className={`w-2.5 h-2.5 rounded-full ${activityIcon(item.activity)} shadow-sm`} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: "0 0 4px 0", fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.4 }}>
                          {item.activity}
                        </p>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{item.actorName}</span>
                          <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 500 }}>{formatRelativeTime(item.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <Link to="/admin/reports" style={{ display: "block", padding: "16px", textAlign: "center", fontSize: "14px", fontWeight: 600, color: "var(--primary)", textDecoration: "none", background: "var(--sidebar-active)" }}>
                    Xem tất cả hoạt động
                  </Link>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default AdminDashboard;
