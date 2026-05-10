const { getPool, sql } = require("../config/db");
const exceljs = require("exceljs");

// ─── GET ALL ASSIGNMENTS ───────────────────────────────────────────────────
const getAllAssignments = async (req, res, next) => {
  try {
    const pool = await getPool();

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 10);
    const offset = (page - 1) * limit;

    const { search, periodId, lecturerId, status, companyId } = req.query;

    let conditions = [];
    let params = { offset, limit };

    if (search) {
      conditions.push(`(s.StudentCode LIKE @Search OR s.FullName LIKE @Search OR l.LecturerCode LIKE @Search OR l.FullName LIKE @Search)`);
      params.Search = `%${search.trim()}%`;
    }
    if (periodId) {
      conditions.push(`a.PeriodId = @PeriodId`);
      params.PeriodId = parseInt(periodId);
    }
    if (lecturerId) {
      conditions.push(`a.LecturerId = @LecturerId`);
      params.LecturerId = parseInt(lecturerId);
    }
    if (companyId) {
      conditions.push(`ir.CompanyId = @CompanyId`);
      params.CompanyId = parseInt(companyId);
    }
    if (status) {
      conditions.push(`s.Status = @Status`);
      params.Status = status;
    }

    const whereClause = conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";

    let countReq = pool.request();
    for (const [k, v] of Object.entries(params)) {
      if (k !== "offset" && k !== "limit") {
        countReq.input(k, typeof v === "number" ? sql.Int : sql.NVarChar, v);
      }
    }
    const countRes = await countReq.query(`
      SELECT COUNT(*) AS total 
      FROM Assignments a
      INNER JOIN Students s ON a.StudentId = s.StudentId
      INNER JOIN Lecturers l ON a.LecturerId = l.LecturerId
      INNER JOIN InternshipPeriods p ON a.PeriodId = p.PeriodId
      LEFT JOIN InternshipRegistrations ir ON a.StudentId = ir.StudentId AND a.PeriodId = ir.PeriodId AND ir.Status = 'APPROVED'
      ${whereClause}
    `);
    const total = countRes.recordset[0].total;

    let dataReq = pool.request();
    for (const [k, v] of Object.entries(params)) {
      dataReq.input(k, typeof v === "number" ? sql.Int : sql.NVarChar, v);
    }
    
    const dataRes = await dataReq.query(`
      SELECT 
        a.AssignmentId, a.AssignedDate,
        s.StudentId, s.StudentCode, s.FullName as StudentName, s.ClassName, s.Status as InternshipStatus, s.GPA,
        l.LecturerId, l.LecturerCode, l.FullName as LecturerName, l.Department as LecturerDepartment,
        p.PeriodId, p.PeriodName, p.Semester, p.AcademicYear,
        c.CompanyId, c.CompanyName
      FROM Assignments a
      INNER JOIN Students s ON a.StudentId = s.StudentId
      INNER JOIN Lecturers l ON a.LecturerId = l.LecturerId
      INNER JOIN InternshipPeriods p ON a.PeriodId = p.PeriodId
      LEFT JOIN InternshipRegistrations ir ON a.StudentId = ir.StudentId AND a.PeriodId = ir.PeriodId AND ir.Status = 'APPROVED'
      LEFT JOIN Companies c ON ir.CompanyId = c.CompanyId
      ${whereClause}
      ORDER BY a.AssignedDate DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `);

    res.json({
      success: true,
      data: {
        assignments: dataRes.recordset,
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
      }
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET ASSIGNMENT BY ID ──────────────────────────────────────────────────
const getAssignmentById = async (req, res, next) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input("AssignmentId", sql.Int, parseInt(req.params.id))
      .query(`
        SELECT 
          a.AssignmentId, a.AssignedDate,
          s.StudentId, s.StudentCode, s.FullName as StudentName, s.ClassName, s.Email as StudentEmail, s.Status as InternshipStatus, s.GPA,
          l.LecturerId, l.LecturerCode, l.FullName as LecturerName, l.Department as LecturerDepartment,
          p.PeriodId, p.PeriodName, p.Semester, p.AcademicYear,
          c.CompanyId, c.CompanyName,
          (SELECT COUNT(*) FROM WeeklyReports w WHERE w.StudentId = s.StudentId AND w.PeriodId = p.PeriodId AND w.Status = 'APPROVED') as CompletedWeeklyReports,
          (SELECT TOP 1 Status FROM FinalReports f WHERE f.StudentId = s.StudentId AND f.PeriodId = p.PeriodId) as FinalReportStatus,
          (SELECT TOP 1 TotalScore FROM Evaluations e WHERE e.StudentId = s.StudentId AND e.PeriodId = p.PeriodId) as EvaluationScore
        FROM Assignments a
        INNER JOIN Students s ON a.StudentId = s.StudentId
        INNER JOIN Lecturers l ON a.LecturerId = l.LecturerId
        INNER JOIN InternshipPeriods p ON a.PeriodId = p.PeriodId
        LEFT JOIN InternshipRegistrations ir ON a.StudentId = ir.StudentId AND a.PeriodId = ir.PeriodId AND ir.Status = 'APPROVED'
        LEFT JOIN Companies c ON ir.CompanyId = c.CompanyId
        WHERE a.AssignmentId = @AssignmentId
      `);
      
    if (result.recordset.length === 0) {
      return res.status(404).json({ success: false, message: "Không tìm thấy phân công" });
    }
    
    res.json({ success: true, data: result.recordset[0] });
  } catch (err) {
    next(err);
  }
};

// ─── CREATE ASSIGNMENT ─────────────────────────────────────────────────────
const createAssignment = async (req, res, next) => {
  try {
    const { studentId, lecturerId, periodId } = req.body;
    
    if (!studentId || !lecturerId || !periodId) {
      return res.status(400).json({ success: false, message: "Thiếu thông tin phân công" });
    }

    const pool = await getPool();

    // RULE 3: Cannot assign in CLOSED internship period.
    const periodCheck = await pool.request().input("PeriodId", sql.Int, periodId).query("SELECT Status FROM InternshipPeriods WHERE PeriodId = @PeriodId");
    if (periodCheck.recordset.length === 0) return res.status(404).json({ success: false, message: "Đợt thực tập không tồn tại" });
    if (periodCheck.recordset[0].Status === 'CLOSED') return res.status(400).json({ success: false, message: "Không thể phân công trong đợt thực tập đã đóng" });

    // RULE 4: Cannot assign inactive lecturer.
    const lecturerCheck = await pool.request().input("LecturerId", sql.Int, lecturerId).query("SELECT u.IsActive FROM Lecturers l JOIN Users u ON l.UserId = u.UserId WHERE l.LecturerId = @LecturerId");
    if (lecturerCheck.recordset.length === 0) return res.status(404).json({ success: false, message: "Giảng viên không tồn tại" });
    if (!lecturerCheck.recordset[0].IsActive) return res.status(400).json({ success: false, message: "Không thể phân công cho giảng viên đang bị khóa tài khoản" });

    // RULE 2: Student MUST already register internship company before assignment.
    // RULE 6: Only students belonging to selected internship period can be assigned.
    const regCheck = await pool.request()
      .input("StudentId", sql.Int, studentId)
      .input("PeriodId", sql.Int, periodId)
      .query("SELECT * FROM InternshipRegistrations WHERE StudentId = @StudentId AND PeriodId = @PeriodId AND Status = 'APPROVED'");
    if (regCheck.recordset.length === 0) {
      return res.status(400).json({ success: false, message: "Sinh viên chưa đăng ký hoặc chưa được duyệt công ty trong đợt thực tập này." });
    }

    // RULE 1 & 5: A student CANNOT have multiple lecturers in the SAME internship period. Prevent duplicate assignment.
    // Note: Schema has StudentId UNIQUE in Assignments. We check if they already exist in Assignments.
    const dupCheck = await pool.request()
      .input("StudentId", sql.Int, studentId)
      .query("SELECT * FROM Assignments WHERE StudentId = @StudentId");
    if (dupCheck.recordset.length > 0) {
      return res.status(400).json({ success: false, message: "Sinh viên này đã được phân công giảng viên hướng dẫn rồi." });
    }

    await pool.request()
      .input("StudentId", sql.Int, studentId)
      .input("LecturerId", sql.Int, lecturerId)
      .input("PeriodId", sql.Int, periodId)
      .query(`
        INSERT INTO Assignments (StudentId, LecturerId, PeriodId)
        VALUES (@StudentId, @LecturerId, @PeriodId)
      `);
      
    res.status(201).json({ success: true, message: "Phân công hướng dẫn thành công" });
  } catch (err) {
    next(err);
  }
};

// ─── UPDATE ASSIGNMENT ─────────────────────────────────────────────────────
const updateAssignment = async (req, res, next) => {
  try {
    const assignmentId = parseInt(req.params.id);
    const { lecturerId, periodId } = req.body; // Can only change lecturer and period. Student stays the same.

    if (!lecturerId || !periodId) {
      return res.status(400).json({ success: false, message: "Thiếu thông tin giảng viên hoặc đợt thực tập" });
    }

    const pool = await getPool();
    const exist = await pool.request().input("AssignmentId", sql.Int, assignmentId).query("SELECT * FROM Assignments WHERE AssignmentId = @AssignmentId");
    if (exist.recordset.length === 0) return res.status(404).json({ success: false, message: "Không tìm thấy phân công" });
    const assignment = exist.recordset[0];

    // Check Period Status
    const periodCheck = await pool.request().input("PeriodId", sql.Int, periodId).query("SELECT Status FROM InternshipPeriods WHERE PeriodId = @PeriodId");
    if (periodCheck.recordset.length === 0) return res.status(404).json({ success: false, message: "Đợt thực tập không tồn tại" });
    if (periodCheck.recordset[0].Status === 'CLOSED') return res.status(400).json({ success: false, message: "Không thể phân công trong đợt thực tập đã đóng" });

    // Check Lecturer Status
    const lecturerCheck = await pool.request().input("LecturerId", sql.Int, lecturerId).query("SELECT u.IsActive FROM Lecturers l JOIN Users u ON l.UserId = u.UserId WHERE l.LecturerId = @LecturerId");
    if (lecturerCheck.recordset.length === 0) return res.status(404).json({ success: false, message: "Giảng viên không tồn tại" });
    if (!lecturerCheck.recordset[0].IsActive) return res.status(400).json({ success: false, message: "Không thể phân công cho giảng viên đang bị khóa tài khoản" });

    // Ensure student has approved registration in the target period
    const regCheck = await pool.request()
      .input("StudentId", sql.Int, assignment.StudentId)
      .input("PeriodId", sql.Int, periodId)
      .query("SELECT * FROM InternshipRegistrations WHERE StudentId = @StudentId AND PeriodId = @PeriodId AND Status = 'APPROVED'");
    if (regCheck.recordset.length === 0) {
      return res.status(400).json({ success: false, message: "Sinh viên chưa đăng ký hoặc chưa được duyệt công ty trong đợt thực tập này." });
    }

    await pool.request()
      .input("AssignmentId", sql.Int, assignmentId)
      .input("LecturerId", sql.Int, lecturerId)
      .input("PeriodId", sql.Int, periodId)
      .query(`
        UPDATE Assignments
        SET LecturerId = @LecturerId, PeriodId = @PeriodId
        WHERE AssignmentId = @AssignmentId
      `);
      
    res.json({ success: true, message: "Cập nhật phân công thành công" });
  } catch (err) {
    next(err);
  }
};

// ─── DELETE ASSIGNMENT ─────────────────────────────────────────────────────
const deleteAssignment = async (req, res, next) => {
  try {
    const assignmentId = parseInt(req.params.id);
    const pool = await getPool();
    
    const exist = await pool.request().input("AssignmentId", sql.Int, assignmentId).query("SELECT * FROM Assignments WHERE AssignmentId = @AssignmentId");
    if (exist.recordset.length === 0) return res.status(404).json({ success: false, message: "Không tìm thấy phân công" });
    const assignment = exist.recordset[0];

    // Rule 5: Cannot delete if student already has submitted reports
    const weeklyCheck = await pool.request().input("StudentId", sql.Int, assignment.StudentId).input("PeriodId", sql.Int, assignment.PeriodId).query("SELECT TOP 1 * FROM WeeklyReports WHERE StudentId = @StudentId AND PeriodId = @PeriodId");
    if (weeklyCheck.recordset.length > 0) return res.status(400).json({ success: false, message: "Không thể xóa: Sinh viên đã nộp báo cáo tuần." });

    const finalCheck = await pool.request().input("StudentId", sql.Int, assignment.StudentId).input("PeriodId", sql.Int, assignment.PeriodId).query("SELECT TOP 1 * FROM FinalReports WHERE StudentId = @StudentId AND PeriodId = @PeriodId");
    if (finalCheck.recordset.length > 0) return res.status(400).json({ success: false, message: "Không thể xóa: Sinh viên đã nộp báo cáo tổng kết." });

    // Cannot delete if evaluations exist
    const evalCheck = await pool.request().input("StudentId", sql.Int, assignment.StudentId).input("PeriodId", sql.Int, assignment.PeriodId).query("SELECT TOP 1 * FROM Evaluations WHERE StudentId = @StudentId AND PeriodId = @PeriodId");
    if (evalCheck.recordset.length > 0) return res.status(400).json({ success: false, message: "Không thể xóa: Phân công này đã có điểm đánh giá." });

    await pool.request().input("AssignmentId", sql.Int, assignmentId).query("DELETE FROM Assignments WHERE AssignmentId = @AssignmentId");
    
    res.json({ success: true, message: "Xóa phân công thành công" });
  } catch (err) {
    next(err);
  }
};

// ─── GET WORKLOAD STATISTICS ───────────────────────────────────────────────
const getWorkloadStatistics = async (req, res, next) => {
  try {
    const periodId = req.query.periodId ? parseInt(req.query.periodId) : null;
    const pool = await getPool();
    
    const periodFilter = periodId ? "AND a.PeriodId = @PeriodId" : "";
    
    let statReq = pool.request();
    if (periodId) statReq.input("PeriodId", sql.Int, periodId);
    
    const statsRes = await statReq.query(`
      SELECT 
        l.LecturerId, l.LecturerCode, l.FullName as LecturerName,
        COUNT(a.StudentId) as TotalStudents,
        SUM(CASE WHEN s.Status = 'COMPLETED' THEN 1 ELSE 0 END) as CompletedStudents,
        SUM(CASE WHEN s.Status = 'IN_PROGRESS' THEN 1 ELSE 0 END) as InProgressStudents
      FROM Lecturers l
      LEFT JOIN Assignments a ON l.LecturerId = a.LecturerId ${periodFilter}
      LEFT JOIN Students s ON a.StudentId = s.StudentId
      GROUP BY l.LecturerId, l.LecturerCode, l.FullName
      HAVING COUNT(a.StudentId) > 0
      ORDER BY TotalStudents DESC
    `);

    res.json({ success: true, data: statsRes.recordset });
  } catch (err) {
    next(err);
  }
};

// ─── EXPORT EXCEL ───────────────────────────────────────────────────────────
const exportAssignmentsExcel = async (req, res, next) => {
  try {
    const pool = await getPool();
    const { search, periodId, lecturerId, status, companyId } = req.query;

    let conditions = [];
    let params = {};

    if (search) {
      conditions.push(`(s.StudentCode LIKE @Search OR s.FullName LIKE @Search OR l.LecturerCode LIKE @Search OR l.FullName LIKE @Search)`);
      params.Search = `%${search.trim()}%`;
    }
    if (periodId) {
      conditions.push(`a.PeriodId = @PeriodId`);
      params.PeriodId = parseInt(periodId);
    }
    if (lecturerId) {
      conditions.push(`a.LecturerId = @LecturerId`);
      params.LecturerId = parseInt(lecturerId);
    }
    if (companyId) {
      conditions.push(`ir.CompanyId = @CompanyId`);
      params.CompanyId = parseInt(companyId);
    }
    if (status) {
      conditions.push(`s.Status = @Status`);
      params.Status = status;
    }

    const whereClause = conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";

    let dataReq = pool.request();
    for (const [k, v] of Object.entries(params)) {
      dataReq.input(k, typeof v === "number" ? sql.Int : sql.NVarChar, v);
    }
    
    const dataRes = await dataReq.query(`
      SELECT 
        a.AssignmentId, a.AssignedDate,
        s.StudentCode, s.FullName as StudentName, s.ClassName, s.Status as InternshipStatus,
        l.LecturerCode, l.FullName as LecturerName,
        p.PeriodName,
        c.CompanyName
      FROM Assignments a
      INNER JOIN Students s ON a.StudentId = s.StudentId
      INNER JOIN Lecturers l ON a.LecturerId = l.LecturerId
      INNER JOIN InternshipPeriods p ON a.PeriodId = p.PeriodId
      LEFT JOIN InternshipRegistrations ir ON a.StudentId = ir.StudentId AND a.PeriodId = ir.PeriodId AND ir.Status = 'APPROVED'
      LEFT JOIN Companies c ON ir.CompanyId = c.CompanyId
      ${whereClause}
      ORDER BY a.AssignedDate DESC
    `);

    const STATUS_MAP = {
      NOT_STARTED: "Chưa bắt đầu",
      IN_PROGRESS: "Đang thực tập",
      COMPLETED: "Hoàn thành"
    };

    const workbook = new exceljs.Workbook();
    const worksheet = workbook.addWorksheet("Phân công hướng dẫn");

    worksheet.columns = [
      { header: "STT", key: "stt", width: 5 },
      { header: "MSSV", key: "studentCode", width: 15 },
      { header: "Họ tên Sinh viên", key: "studentName", width: 30 },
      { header: "Lớp", key: "className", width: 15 },
      { header: "Đợt thực tập", key: "periodName", width: 25 },
      { header: "Công ty thực tập", key: "companyName", width: 35 },
      { header: "Giảng viên HD", key: "lecturerName", width: 30 },
      { header: "Trạng thái", key: "status", width: 20 },
      { header: "Ngày phân công", key: "assignedDate", width: 20 },
    ];

    worksheet.getRow(1).font = { bold: true };

    dataRes.recordset.forEach((a, index) => {
      worksheet.addRow({
        stt: index + 1,
        studentCode: a.StudentCode,
        studentName: a.StudentName,
        className: a.ClassName,
        periodName: a.PeriodName,
        companyName: a.CompanyName || "Chưa ĐK",
        lecturerName: `${a.LecturerName} (${a.LecturerCode})`,
        status: STATUS_MAP[a.InternshipStatus] || a.InternshipStatus,
        assignedDate: a.AssignedDate ? new Date(a.AssignedDate).toLocaleDateString("vi-VN") : "",
      });
    });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=Assignments.xlsx");
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    next(err);
  }
};

// ─── UTILS API FOR CREATE FORM ───────────────────────────────────────────────
const getEligibleStudents = async (req, res, next) => {
  try {
    const periodId = parseInt(req.query.periodId);
    if (!periodId) return res.status(400).json({ success: false, message: "Missing periodId" });

    const pool = await getPool();
    // Get students who have approved registration in this period BUT do not have an assignment yet.
    const dataRes = await pool.request().input("PeriodId", sql.Int, periodId).query(`
      SELECT 
        s.StudentId, s.StudentCode, s.FullName, s.ClassName,
        c.CompanyId, c.CompanyName
      FROM Students s
      INNER JOIN InternshipRegistrations ir ON s.StudentId = ir.StudentId AND ir.PeriodId = @PeriodId AND ir.Status = 'APPROVED'
      INNER JOIN Companies c ON ir.CompanyId = c.CompanyId
      LEFT JOIN Assignments a ON s.StudentId = a.StudentId
      WHERE a.AssignmentId IS NULL
      ORDER BY s.StudentCode
    `);

    res.json({ success: true, data: dataRes.recordset });
  } catch(err) {
    next(err);
  }
};

module.exports = {
  getAllAssignments,
  getAssignmentById,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  getWorkloadStatistics,
  exportAssignmentsExcel,
  getEligibleStudents
};
