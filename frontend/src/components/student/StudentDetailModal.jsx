import { BookOpen, Calendar, Mail, Phone, MapPin, Building2, User, CheckCircle2, AlertCircle, Clock, GraduationCap, Award } from "lucide-react";

const STATUS_MAP = {
  NOT_STARTED: { label: "Chưa bắt đầu", cls: "bg-slate-100 text-slate-700 border-slate-200" },
  IN_PROGRESS:  { label: "Đang thực tập", cls: "bg-blue-100 text-blue-700 border-blue-200" },
  COMPLETED:    { label: "Hoàn thành",    cls: "bg-emerald-100 text-emerald-700 border-emerald-200" },
};

const StudentDetailModal = ({ student, onClose, onEdit }) => {
  const createdAt = student.CreatedAt
    ? new Date(student.CreatedAt).toLocaleDateString("vi-VN", {
        day: "2-digit", month: "2-digit", year: "numeric",
      })
    : "—";

  const status    = STATUS_MAP[student.InternshipStatus] || STATUS_MAP["NOT_STARTED"];
  const isActive  = student.IsActive === 1 || student.IsActive === true;

  const Row = ({ label, value, icon: Icon }) => (
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
      {Icon && <Icon className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />}
      <div>
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{label}</div>
        <div className="text-sm font-medium text-slate-800">{value || <span className="text-slate-400 italic font-normal">Chưa cập nhật</span>}</div>
      </div>
    </div>
  );

  const StatBox = ({ label, value, color }) => {
    const colors = {
      blue: "bg-blue-50 text-blue-700 border-blue-100",
      emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
      amber: "bg-amber-50 text-amber-700 border-amber-100",
      rose: "bg-rose-50 text-rose-700 border-rose-100",
      slate: "bg-slate-50 text-slate-700 border-slate-100"
    };
    return (
      <div className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center ${colors[color] || colors.slate}`}>
        <div className="text-2xl font-bold mb-1">{value}</div>
        <div className="text-xs font-medium opacity-80">{label}</div>
      </div>
    );
  };

  const getRank = (score) => {
    if (!score && score !== 0) return "Chưa có";
    if (score >= 9) return "Xuất sắc";
    if (score >= 8) return "Giỏi";
    if (score >= 7) return "Khá";
    if (score >= 5) return "Trung bình";
    return "Yếu";
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ padding: "20px" }}>
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: "1000px", width: "100%", maxHeight: "calc(100vh - 40px)", display: "flex", flexDirection: "column", borderRadius: "20px" }}>
        
        <div className="modal-header" style={{ padding: "24px 32px", borderBottom: "1px solid var(--border)" }}>
          <div className="modal-title-group" style={{ gap: "16px" }}>
            <span className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <User size={24} />
            </span>
            <div>
              <h2 className="modal-title" style={{ fontSize: "22px" }}>Hồ sơ Sinh viên</h2>
              <p className="modal-subtitle" style={{ fontSize: "15px", marginTop: "4px" }}>Xem chi tiết thông tin và tiến độ</p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose} style={{ background: "var(--bg-page)" }}>✕</button>
        </div>

        <div className="modal-body" style={{ overflowY: "auto", padding: "32px", background: "#f8fafc", display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* Header Profile Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-start gap-6">
            <div className="w-24 h-24 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-4xl font-black shadow-sm flex-shrink-0 border-4 border-white ring-1 ring-slate-200">
              {student.FullName.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-2xl font-bold text-slate-800">{student.FullName}</h3>
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${status.cls}`}>
                    {status.label}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"}`}>
                    {isActive ? "● Hoạt động" : "● Vô hiệu"}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-slate-500 mb-4">
                <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200 text-slate-700"><MapPin size={16} /> {student.StudentCode}</div>
                <div className="flex items-center gap-1.5"><Mail size={16} /> {student.Email || "Chưa cập nhật"}</div>
                <div className="flex items-center gap-1.5"><Phone size={16} /> {student.Phone || "Chưa cập nhật"}</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Cột trái */}
            <div className="flex flex-col gap-6">
              
              {/* Thông tin học vụ */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <h4 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-blue-500 rounded-full"></span>
                  Thông tin học vụ
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <Row label="Lớp" value={student.ClassName} icon={BookOpen} />
                  <Row label="Ngày tham gia" value={createdAt} icon={Calendar} />
                  <Row label="GPA" value={student.GPA !== null && student.GPA !== undefined ? String(student.GPA) : null} icon={Award} />
                  <Row label="Tên đăng nhập" value={student.Username} icon={User} />
                </div>
              </div>

              {/* Thông tin thực tập */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <h4 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-purple-500 rounded-full"></span>
                  Thông tin thực tập
                </h4>
                <div className="flex flex-col">
                  <Row label="Đợt thực tập" value={student.PeriodName ? `${student.PeriodName} (${student.Semester}-${student.AcademicYear})` : null} icon={Calendar} />
                  <Row label="Công ty thực tập" value={student.CompanyName} icon={Building2} />
                  <Row label="Giảng viên hướng dẫn" value={student.LecturerName ? `${student.LecturerName} (${student.LecturerCode})` : null} icon={GraduationCap} />
                  <Row label="Khoa GV" value={student.LecturerDepartment} icon={MapPin} />
                </div>
              </div>

            </div>

            {/* Cột phải */}
            <div className="flex flex-col gap-6">

              {/* Tiến độ báo cáo */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-base font-bold text-slate-800 flex items-center gap-2 m-0">
                    <span className="w-1.5 h-6 bg-emerald-500 rounded-full"></span>
                    Tiến độ báo cáo
                  </h4>
                  {student.TotalReportsSubmitted > 0 && (
                    <div className="text-2xl font-black text-emerald-500 leading-none">
                      {Math.round((student.ApprovedReports / student.TotalReportsSubmitted) * 100)}%
                    </div>
                  )}
                </div>

                {student.TotalReportsSubmitted > 0 ? (
                  <>
                    <div className="w-full bg-slate-100 rounded-full h-3 mb-6 overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${(student.ApprovedReports / student.TotalReportsSubmitted) * 100}%` }}></div>
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                      <StatBox label="Đã nộp" value={student.TotalReportsSubmitted} color="blue" />
                      <StatBox label="Đã duyệt" value={student.ApprovedReports} color="emerald" />
                      <StatBox label="Chờ duyệt" value={student.PendingReports} color="amber" />
                      <StatBox label="Cần sửa" value={student.RevisionReports} color="rose" />
                    </div>
                  </>
                ) : (
                  <div className="text-center p-6 border border-dashed border-slate-200 rounded-xl bg-slate-50 text-slate-500 font-medium">
                    Sinh viên chưa nộp báo cáo nào.
                  </div>
                )}
              </div>

              {/* Kết quả đánh giá */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex-1">
                <div className="flex justify-between items-center mb-6">
                  <h4 className="text-base font-bold text-slate-800 flex items-center gap-2 m-0">
                    <span className="w-1.5 h-6 bg-amber-500 rounded-full"></span>
                    Kết quả đánh giá
                  </h4>
                  {student.TotalScore !== null && student.TotalScore !== undefined && (
                    <div className="bg-amber-100 text-amber-700 px-3 py-1 rounded-lg text-sm font-bold border border-amber-200">
                      Xếp loại: {getRank(student.TotalScore)}
                    </div>
                  )}
                </div>

                {student.TotalScore !== null && student.TotalScore !== undefined ? (
                  <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-sm font-semibold text-slate-600">Điểm quá trình</span>
                        <span className="text-base font-bold text-slate-800">{student.ProcessScore}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-sm font-semibold text-slate-600">Điểm báo cáo tuần</span>
                        <span className="text-base font-bold text-slate-800">{student.WeeklyReportScore}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-sm font-semibold text-slate-600">Điểm báo cáo CK</span>
                        <span className="text-base font-bold text-slate-800">{student.FinalReportScore}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-sm font-semibold text-slate-600">Điểm thái độ</span>
                        <span className="text-base font-bold text-slate-800">{student.AttitudeScore}</span>
                      </div>
                    </div>
                    
                    <div className="mt-2 p-4 bg-amber-50 rounded-xl border border-amber-100 flex justify-between items-center">
                      <span className="text-base font-bold text-amber-800 uppercase">Tổng điểm</span>
                      <span className="text-3xl font-black text-amber-600">{student.TotalScore}</span>
                    </div>
                  </div>
                ) : (
                  <div className="h-full min-h-[160px] flex flex-col items-center justify-center p-6 border border-dashed border-slate-200 rounded-xl bg-slate-50 text-slate-500 font-medium">
                    <Award size={32} className="text-slate-300 mb-2" />
                    Chưa có đánh giá tổng kết
                  </div>
                )}
              </div>

            </div>

          </div>

          <div className="modal-footer" style={{ borderTop: "none", paddingTop: 0, paddingBottom: 0 }}>
            <button className="btn-secondary" onClick={onClose} style={{ marginLeft: "auto" }}>Đóng</button>
            <button className="btn-primary" onClick={onEdit}>
              Chỉnh sửa thông tin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDetailModal;
