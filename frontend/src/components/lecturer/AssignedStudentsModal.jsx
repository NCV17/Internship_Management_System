import { useState, useEffect } from "react";
import { lecturerAPI } from "../../services/api";

const AssignedStudentsModal = ({ lecturer, periodId, onClose }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        const res = await lecturerAPI.getAssignedStudents(lecturer.LecturerId, { periodId });
        setStudents(res.data.data || []);
      } catch (err) {
        console.error("Failed to fetch assigned students:", err);
      } finally {
        setLoading(false);
      }
    };

    if (lecturer?.LecturerId) {
      fetchStudents();
    }
  }, [lecturer, periodId]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "700px" }}>
        <div className="modal-header">
          <div className="modal-title-group">
            <span className="modal-icon"><svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg></span>
            <div>
              <h2 className="modal-title">Sinh viên hướng dẫn</h2>
              <p className="modal-subtitle">
                Giảng viên: <strong>{lecturer.FullName}</strong> ({lecturer.LecturerCode})
              </p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        
        <div className="modal-body" style={{ padding: "0" }}>
          {loading ? (
            <div style={{ padding: "40px 0", textAlign: "center" }}>
              <div className="spinner-blue"></div>
            </div>
          ) : students.length === 0 ? (
            <div style={{ padding: "40px 0", textAlign: "center", color: "var(--text-muted)", fontSize: "14px" }}>
              Chưa có sinh viên nào được phân công trong đợt này.
            </div>
          ) : (
            <div style={{ maxHeight: "450px", overflowY: "auto", borderTop: "1px solid var(--border)" }}>
              <table className="lm-table" style={{ margin: 0, border: "none" }}>
                <thead style={{ position: "sticky", top: 0, background: "var(--bg-page)", zIndex: 1, boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                  <tr>
                    <th style={{ padding: "12px 24px", width: "120px" }}>MSSV</th>
                    <th style={{ padding: "12px 16px" }}>Họ và tên</th>
                    <th style={{ padding: "12px 16px", width: "100px" }}>Lớp</th>
                    <th style={{ padding: "12px 24px", width: "160px" }}>Đợt thực tập</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s, i) => (
                    <tr key={s.StudentId} style={{ borderBottom: "1px solid var(--border)", background: i % 2 === 0 ? "white" : "var(--bg-page)" }} className="hover:bg-slate-50 transition-colors">
                      <td style={{ padding: "12px 24px" }}><span className="lm-code-badge">{s.StudentCode}</span></td>
                      <td style={{ padding: "12px 16px", fontWeight: 600, color: "var(--text-primary)" }}>{s.FullName}</td>
                      <td style={{ padding: "12px 16px", color: "var(--text-secondary)", fontSize: "14px" }}>{s.ClassName}</td>
                      <td style={{ padding: "12px 24px" }}><span style={{ fontSize: "12px", background: "var(--bg-card)", border: "1px solid var(--border)", padding: "4px 8px", borderRadius: "6px", color: "var(--text-secondary)", fontWeight: 500 }}>{s.PeriodName}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose} style={{ marginLeft: "auto" }}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignedStudentsModal;
