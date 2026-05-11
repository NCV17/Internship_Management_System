const { getPool, sql } = require("../config/db");
const ExcelJS = require("exceljs");

// ─── GET ALL REPORTS ────────────────────────────────────────────────────────
const getReports = async (req, res, next) => {
  try {
    const { periodId, lecturerId, status, type, studentId } = req.query;
    const pool = await getPool();

    let weeklyConditions = ["1=1"];
    let finalConditions = ["1=1"];
    
    // Add filters
    if (periodId) {
      weeklyConditions.push(`wr.PeriodId = ${parseInt(periodId)}`);
      finalConditions.push(`fr.PeriodId = ${parseInt(periodId)}`);
    }
    if (lecturerId) {
      weeklyConditions.push(`a.LecturerId = ${parseInt(lecturerId)}`);
      finalConditions.push(`a.LecturerId = ${parseInt(lecturerId)}`);
    }
    if (status) {
      weeklyConditions.push(`wr.Status = '${status}'`);
      finalConditions.push(`fr.Status = '${status}'`);
    }
    if (studentId) {
      weeklyConditions.push(`wr.StudentId = ${parseInt(studentId)}`);
      finalConditions.push(`fr.StudentId = ${parseInt(studentId)}`);
    }

    const weeklyQuery = `
      SELECT 
        wr.ReportId as Id,
        'WEEKLY' as Type,
        wr.WeekNumber,
        wr.Title,
        wr.Content as Description,
        wr.FilePath,
        wr.Status,
        wr.SubmittedAt,
        s.StudentCode,
        s.FullName as StudentName,
        l.FullName as LecturerName,
        c.CompanyName,
        p.PeriodName
      FROM WeeklyReports wr
      INNER JOIN Students s ON wr.StudentId = s.StudentId
      LEFT JOIN Assignments a ON s.StudentId = a.StudentId AND wr.PeriodId = a.PeriodId
      LEFT JOIN Lecturers l ON a.LecturerId = l.LecturerId
      LEFT JOIN InternshipRegistrations ir ON s.StudentId = ir.StudentId AND wr.PeriodId = ir.PeriodId
      LEFT JOIN Companies c ON ir.CompanyId = c.CompanyId
      LEFT JOIN InternshipPeriods p ON wr.PeriodId = p.PeriodId
      WHERE ${weeklyConditions.join(" AND ")}
    `;

    const finalQuery = `
      SELECT 
        fr.FinalReportId as Id,
        'FINAL' as Type,
        NULL as WeekNumber,
        fr.Title,
        fr.Description,
        fr.FilePath,
        fr.Status,
        fr.SubmittedAt,
        s.StudentCode,
        s.FullName as StudentName,
        l.FullName as LecturerName,
        c.CompanyName,
        p.PeriodName
      FROM FinalReports fr
      INNER JOIN Students s ON fr.StudentId = s.StudentId
      LEFT JOIN Assignments a ON s.StudentId = a.StudentId AND fr.PeriodId = a.PeriodId
      LEFT JOIN Lecturers l ON a.LecturerId = l.LecturerId
      LEFT JOIN InternshipRegistrations ir ON s.StudentId = ir.StudentId AND fr.PeriodId = ir.PeriodId
      LEFT JOIN Companies c ON ir.CompanyId = c.CompanyId
      LEFT JOIN InternshipPeriods p ON fr.PeriodId = p.PeriodId
      WHERE ${finalConditions.join(" AND ")}
    `;

    let finalUnionQuery = "";
    if (type === "WEEKLY") {
      finalUnionQuery = weeklyQuery;
    } else if (type === "FINAL") {
      finalUnionQuery = finalQuery;
    } else {
      finalUnionQuery = `${weeklyQuery} UNION ALL ${finalQuery}`;
    }

    finalUnionQuery += " ORDER BY SubmittedAt DESC";

    const result = await pool.request().query(finalUnionQuery);

    res.json({ success: true, data: result.recordset });
  } catch (err) {
    next(err);
  }
};

// ─── REVIEW REPORT ──────────────────────────────────────────────────────────
const reviewReport = async (req, res, next) => {
  try {
    const { id, type } = req.params;
    const { status, comment } = req.body;
    
    if (!["APPROVED", "REJECTED", "REVISION_REQUIRED"].includes(status)) {
      return res.status(400).json({ success: false, message: "Trạng thái không hợp lệ." });
    }

    const pool = await getPool();

    if (type === "WEEKLY") {
      // RULE: Do not allow approval if no file
      const check = await pool.request().query(`SELECT FilePath FROM WeeklyReports WHERE ReportId = ${parseInt(id)}`);
      if (check.recordset.length === 0) return res.status(404).json({ success: false, message: "Không tìm thấy báo cáo." });
      if (status === "APPROVED" && (!check.recordset[0].FilePath || check.recordset[0].FilePath.trim() === "")) {
        return res.status(400).json({ success: false, message: "Không được duyệt nếu chưa có file báo cáo." });
      }

      await pool.request()
        .input("Status", sql.NVarChar, status)
        .input("Comment", sql.NVarChar, comment || null)
        .query(`UPDATE WeeklyReports SET Status = @Status, LecturerComment = @Comment WHERE ReportId = ${parseInt(id)}`);
      
    } else if (type === "FINAL") {
      const check = await pool.request().query(`SELECT FilePath FROM FinalReports WHERE FinalReportId = ${parseInt(id)}`);
      if (check.recordset.length === 0) return res.status(404).json({ success: false, message: "Không tìm thấy báo cáo." });
      if (status === "APPROVED" && (!check.recordset[0].FilePath || check.recordset[0].FilePath.trim() === "")) {
        return res.status(400).json({ success: false, message: "Không được duyệt nếu chưa có file báo cáo." });
      }

      await pool.request()
        .input("Status", sql.NVarChar, status)
        .input("Comment", sql.NVarChar, comment || null)
        .query(`UPDATE FinalReports SET Status = @Status, LecturerComment = @Comment WHERE FinalReportId = ${parseInt(id)}`);
    } else {
      return res.status(400).json({ success: false, message: "Loại báo cáo không hợp lệ." });
    }

    res.json({ success: true, message: "Đã đánh giá báo cáo thành công." });
  } catch (err) {
    next(err);
  }
};

// ─── EXPORT EXCEL ──────────────────────────────────────────────────────────
const exportReportsExcel = async (req, res, next) => {
  try {
    // Re-use logic from getReports to fetch data
    req.query.limit = 10000;
    const { periodId, lecturerId, status, type } = req.query;
    const pool = await getPool();

    let weeklyConditions = ["1=1"];
    let finalConditions = ["1=1"];
    
    if (periodId) {
      weeklyConditions.push(`wr.PeriodId = ${parseInt(periodId)}`);
      finalConditions.push(`fr.PeriodId = ${parseInt(periodId)}`);
    }
    if (lecturerId) {
      weeklyConditions.push(`a.LecturerId = ${parseInt(lecturerId)}`);
      finalConditions.push(`a.LecturerId = ${parseInt(lecturerId)}`);
    }
    if (status) {
      weeklyConditions.push(`wr.Status = '${status}'`);
      finalConditions.push(`fr.Status = '${status}'`);
    }

    const weeklyQuery = `
      SELECT 'Báo cáo tuần ' + CAST(wr.WeekNumber as VARCHAR) as TypeText, wr.Title, wr.Status, wr.SubmittedAt, s.StudentCode, s.FullName as StudentName, l.FullName as LecturerName, c.CompanyName, p.PeriodName
      FROM WeeklyReports wr
      INNER JOIN Students s ON wr.StudentId = s.StudentId
      LEFT JOIN Assignments a ON s.StudentId = a.StudentId AND wr.PeriodId = a.PeriodId
      LEFT JOIN Lecturers l ON a.LecturerId = l.LecturerId
      LEFT JOIN InternshipRegistrations ir ON s.StudentId = ir.StudentId AND wr.PeriodId = ir.PeriodId
      LEFT JOIN Companies c ON ir.CompanyId = c.CompanyId
      LEFT JOIN InternshipPeriods p ON wr.PeriodId = p.PeriodId
      WHERE ${weeklyConditions.join(" AND ")}
    `;

    const finalQuery = `
      SELECT 'Báo cáo tổng kết' as TypeText, fr.Title, fr.Status, fr.SubmittedAt, s.StudentCode, s.FullName as StudentName, l.FullName as LecturerName, c.CompanyName, p.PeriodName
      FROM FinalReports fr
      INNER JOIN Students s ON fr.StudentId = s.StudentId
      LEFT JOIN Assignments a ON s.StudentId = a.StudentId AND fr.PeriodId = a.PeriodId
      LEFT JOIN Lecturers l ON a.LecturerId = l.LecturerId
      LEFT JOIN InternshipRegistrations ir ON s.StudentId = ir.StudentId AND fr.PeriodId = ir.PeriodId
      LEFT JOIN Companies c ON ir.CompanyId = c.CompanyId
      LEFT JOIN InternshipPeriods p ON fr.PeriodId = p.PeriodId
      WHERE ${finalConditions.join(" AND ")}
    `;

    let finalUnionQuery = "";
    if (type === "WEEKLY") finalUnionQuery = weeklyQuery;
    else if (type === "FINAL") finalUnionQuery = finalQuery;
    else finalUnionQuery = `${weeklyQuery} UNION ALL ${finalQuery}`;
    finalUnionQuery += " ORDER BY SubmittedAt DESC";

    const result = await pool.request().query(finalUnionQuery);
    const reports = result.recordset;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Bao_Cao");

    worksheet.columns = [
      { header: "STT", key: "stt", width: 5 },
      { header: "MSSV", key: "StudentCode", width: 15 },
      { header: "Sinh viên", key: "StudentName", width: 25 },
      { header: "Loại báo cáo", key: "TypeText", width: 20 },
      { header: "Tên báo cáo", key: "Title", width: 30 },
      { header: "Đợt thực tập", key: "PeriodName", width: 25 },
      { header: "Công ty", key: "CompanyName", width: 25 },
      { header: "Giảng viên HD", key: "LecturerName", width: 25 },
      { header: "Ngày nộp", key: "SubmittedAt", width: 20 },
      { header: "Trạng thái", key: "Status", width: 15 },
    ];

    const statusMap = {
      PENDING: "Chờ duyệt",
      APPROVED: "Đã duyệt",
      REJECTED: "Bị từ chối",
      REVISION_REQUIRED: "Yêu cầu làm lại"
    };

    reports.forEach((r, idx) => {
      worksheet.addRow({
        stt: idx + 1,
        StudentCode: r.StudentCode,
        StudentName: r.StudentName,
        TypeText: r.TypeText,
        Title: r.Title,
        PeriodName: r.PeriodName,
        CompanyName: r.CompanyName || "Chưa ĐK",
        LecturerName: r.LecturerName || "Chưa PC",
        SubmittedAt: r.SubmittedAt ? new Date(r.SubmittedAt).toLocaleDateString("vi-VN") : "",
        Status: statusMap[r.Status] || r.Status
      });
    });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=Danh_sach_Bao_cao.xlsx");
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getReports,
  reviewReport,
  exportReportsExcel
};
