import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { dashboardAPI } from "../services/api";
import { useToast } from "../context/ToastContext";
import {
  Users, GraduationCap, Building2, CalendarDays,
  ClipboardCheck, AlertCircle, Inbox, Activity,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  ResponsiveContainer, Tooltip as RechartsTooltip,
} from "recharts";

/* ════════════════════════════════════════════════════════════════════════════
   REUSABLE COMPONENTS
   ════════════════════════════════════════════════════════════════════════════ */

// ── StatisticCard ─────────────────────────────────────────────────────────
const StatisticCard = ({ label, value, icon: Icon, color }) => {
  const palette = {
    blue:   { bg: "bg-blue-50",    text: "text-blue-600",    border: "border-l-blue-500",   numText: "text-blue-700"    },
    indigo: { bg: "bg-indigo-50",  text: "text-indigo-600",  border: "border-l-indigo-500", numText: "text-indigo-700"  },
    teal:   { bg: "bg-teal-50",    text: "text-teal-600",    border: "border-l-teal-500",   numText: "text-teal-700"    },
    purple: { bg: "bg-purple-50",  text: "text-purple-600",  border: "border-l-purple-500", numText: "text-purple-700"  },
    green:  { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-l-emerald-500",numText: "text-emerald-700" },
    amber:  { bg: "bg-amber-50",   text: "text-amber-600",   border: "border-l-amber-500",  numText: "text-amber-700"   },
  };
  const c = palette[color] || palette.blue;

  return (
    <div className={`bg-white rounded-2xl border border-gray-100 border-l-4 ${c.border} shadow-sm hover:shadow-md transition-all duration-200 p-6 flex flex-col items-center justify-center text-center min-h-[140px]`}>
      <div className={`w-11 h-11 rounded-xl ${c.bg} ${c.text} flex items-center justify-center mb-3`}>
        <Icon size={22} strokeWidth={2} />
      </div>
      <p className={`text-4xl font-bold ${c.numText} tracking-tight leading-none`}>
        {value ?? "—"}
      </p>
      <p className="text-sm text-gray-500 font-medium mt-2">{label}</p>
    </div>
  );
};

// ── EmptyState ────────────────────────────────────────────────────────────
const EmptyState = ({ message }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mb-3">
      <Inbox size={22} className="text-gray-300" />
    </div>
    <p className="text-sm text-gray-400">{message || "Chưa có dữ liệu"}</p>
  </div>
);

// ── Skeleton ──────────────────────────────────────────────────────────────
const Skeleton = ({ className = "" }) => (
  <div className={`animate-pulse bg-gray-100 rounded-2xl ${className}`} />
);

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

const formatDate = () => {
  return new Date().toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
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

  /* ── Loading ─────────────────────────────────────────────────────────── */
  if (loading) {
    return (
      <>
        <div className="topbar">
          <div>
            <div className="topbar-title">Bảng điều khiển</div>
            <div className="topbar-subtitle">Tổng quan hệ thống quản lý thực tập</div>
          </div>
        </div>
        <div className="page-content">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-[130px]" />)}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
              <Skeleton className="lg:col-span-3 h-[360px]" />
              <Skeleton className="lg:col-span-2 h-[360px]" />
            </div>
          </div>
        </div>
      </>
    );
  }

  /* ── Card config ─────────────────────────────────────────────────────── */
  const cards = [
    { label: "Tổng Sinh viên",        value: overview?.TotalStudents ?? 0,     icon: Users,          color: "blue"   },
    { label: "Tổng Giảng viên",       value: overview?.TotalLecturers ?? 0,    icon: GraduationCap,  color: "indigo" },
    { label: "Tổng Công ty",          value: overview?.TotalCompanies ?? 0,    icon: Building2,      color: "teal"   },
    { label: "Đợt thực tập đang mở", value: overview?.ActivePeriods ?? 0,     icon: CalendarDays,   color: "purple" },
    { label: "Đã phân công GVHD",    value: overview?.AssignedStudents ?? 0,  icon: ClipboardCheck, color: "green"  },
    { label: "Chưa phân công",       value: overview?.UnassignedStudents ?? 0,icon: AlertCircle,    color: "amber"  },
  ];

  return (
    <>
      {/* ── TOPBAR ──────────────────────────────────────────────────────── */}
      <div className="topbar">
        <div>
          <div className="topbar-title">Bảng điều khiển</div>
          <div className="topbar-subtitle">Tổng quan hệ thống quản lý thực tập</div>
        </div>
        <div className="hidden sm:flex items-center gap-3">
          {currentPeriod && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-lg text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="font-semibold text-blue-700">{currentPeriod.PeriodName}</span>
              <span className="text-blue-400">·</span>
              <span className="text-blue-500">HK{currentPeriod.Semester} — {currentPeriod.AcademicYear}</span>
            </div>
          )}
          <span className="text-xs text-gray-400 capitalize">{formatDate()}</span>
        </div>
      </div>

      {/* ── PAGE ────────────────────────────────────────────────────────── */}
      <div className="page-content">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* ── STAT CARDS ───────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {cards.map((c) => (
              <StatisticCard key={c.label} {...c} />
            ))}
          </div>

          {/* ── ANALYTICS ROW ────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

            {/* Chart */}
            <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">Khối lượng hướng dẫn giảng viên</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Số sinh viên được phân công theo giảng viên</p>
                </div>
              </div>
              <div className="p-5">
                {lecturerWorkload.length === 0 ? (
                  <EmptyState message="Chưa có dữ liệu phân công" />
                ) : (
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={lecturerWorkload.slice(0, 8)}
                        layout="vertical"
                        margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                        <XAxis
                          type="number"
                          tick={{ fill: "#9ca3af", fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                          allowDecimals={false}
                        />
                        <YAxis
                          dataKey="name"
                          type="category"
                          width={120}
                          tick={{ fill: "#6b7280", fontSize: 12 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <RechartsTooltip
                          cursor={{ fill: "#f9fafb" }}
                          contentStyle={{
                            borderRadius: "8px",
                            border: "1px solid #e5e7eb",
                            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
                            fontSize: "12px",
                          }}
                          formatter={(v) => [`${v} sinh viên`, "Phân công"]}
                        />
                        <Bar
                          dataKey="count"
                          fill="#6366f1"
                          radius={[0, 4, 4, 0]}
                          barSize={14}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
              <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
                <Activity size={16} className="text-gray-400" />
                <h3 className="text-sm font-semibold text-slate-800">Hoạt động gần đây</h3>
              </div>
              <div className="flex-1 overflow-y-auto">
                {recentActivities.length === 0 ? (
                  <EmptyState message="Chưa có hoạt động nào" />
                ) : (
                  <div className="divide-y divide-gray-50">
                    {recentActivities.slice(0, 6).map((item, idx) => (
                      <div key={idx} className="px-5 py-3 flex items-start gap-3 hover:bg-gray-50/60 transition-colors">
                        <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${activityIcon(item.activity)}`} />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-gray-700 leading-snug">{item.activity}</p>
                          <p className="text-xs text-gray-400 mt-0.5 truncate">{item.actorName}</p>
                        </div>
                        <span className="text-xs text-gray-400 flex-shrink-0 whitespace-nowrap">
                          {formatRelativeTime(item.createdAt)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;
