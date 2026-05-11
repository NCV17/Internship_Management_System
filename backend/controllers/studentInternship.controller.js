const { getPool, sql } = require("../config/db");

// ─── GET OPEN PERIOD ──────────────────────────────────────────────────────────
const getOpenPeriod = async (req, res, next) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT TOP 1 PeriodId, PeriodName, Semester, AcademicYear, StartDate, EndDate, Status
      FROM InternshipPeriods
      WHERE Status = 'ACTIVE'
      ORDER BY StartDate DESC
    `);
    res.json({ success: true, data: result.recordset[0] || null });
  } catch (err) {
    next(err);
  }
};

// ─── GET COMPANIES LIST ───────────────────────────────────────────────────────
const getCompanies = async (req, res, next) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT CompanyId, CompanyName, Address, Field, ContactPerson, ContactEmail, ContactPhone
      FROM Companies
      ORDER BY CompanyName ASC
    `);
    res.json({ success: true, data: result.recordset });
  } catch (err) {
    next(err);
  }
};

// ─── GET MY REGISTRATION ──────────────────────────────────────────────────────
const getMyRegistration = async (req, res, next) => {
  try {
    const pool = await getPool();
    const userId = req.user.userId;

    // Get studentId from userId
    const studentResult = await pool.request()
      .input("UserId", sql.Int, userId)
      .query(`SELECT StudentId FROM Students WHERE UserId = @UserId`);

    if (studentResult.recordset.length === 0) {
      return res.status(404).json({ success: false, message: "Không tìm thấy sinh viên." });
    }

    const studentId = studentResult.recordset[0].StudentId;

    // Get registration with company + period info
    const regResult = await pool.request()
      .input("StudentId", sql.Int, studentId)
      .query(`
        SELECT 
          ir.RegistrationId, ir.StudentId, ir.CompanyId, ir.PeriodId,
          ir.RegisteredAt, ir.Status,
          c.CompanyName, c.Address, c.Field,
          c.ContactPerson, c.ContactEmail, c.ContactPhone,
          p.PeriodName, p.Semester, p.AcademicYear
        FROM InternshipRegistrations ir
        INNER JOIN Companies c ON ir.CompanyId = c.CompanyId
        INNER JOIN InternshipPeriods p ON ir.PeriodId = p.PeriodId
        WHERE ir.StudentId = @StudentId
      `);

    // Check if student has been assigned a lecturer
    const assignResult = await pool.request()
      .input("StudentId2", sql.Int, studentId)
      .query(`
        SELECT a.AssignmentId, l.FullName AS LecturerName
        FROM Assignments a
        INNER JOIN Lecturers l ON a.LecturerId = l.LecturerId
        WHERE a.StudentId = @StudentId2
      `);

    res.json({
      success: true,
      data: {
        registration: regResult.recordset[0] || null,
        assignment: assignResult.recordset[0] || null,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── REGISTER INTERNSHIP ──────────────────────────────────────────────────────
const registerInternship = async (req, res, next) => {
  try {
    const pool = await getPool();
    const userId = req.user.userId;
    const { companyId } = req.body;

    if (!companyId) {
      return res.status(400).json({ success: false, message: "Vui lòng chọn công ty." });
    }

    // Get studentId
    const studentResult = await pool.request()
      .input("UserId", sql.Int, userId)
      .query(`SELECT StudentId FROM Students WHERE UserId = @UserId`);

    if (studentResult.recordset.length === 0) {
      return res.status(404).json({ success: false, message: "Không tìm thấy sinh viên." });
    }

    const studentId = studentResult.recordset[0].StudentId;

    // Check if already registered
    const existingReg = await pool.request()
      .input("StudentId", sql.Int, studentId)
      .query(`SELECT RegistrationId FROM InternshipRegistrations WHERE StudentId = @StudentId`);

    if (existingReg.recordset.length > 0) {
      return res.status(400).json({ success: false, message: "Bạn đã đăng ký công ty thực tập." });
    }

    // Check if already assigned lecturer
    const existingAssign = await pool.request()
      .input("StudentId2", sql.Int, studentId)
      .query(`SELECT AssignmentId FROM Assignments WHERE StudentId = @StudentId2`);

    if (existingAssign.recordset.length > 0) {
      return res.status(400).json({ success: false, message: "Bạn đã được phân công giảng viên hướng dẫn. Không thể thay đổi." });
    }

    // Get active period
    const periodResult = await pool.request().query(`
      SELECT TOP 1 PeriodId FROM InternshipPeriods WHERE Status = 'ACTIVE' ORDER BY StartDate DESC
    `);

    if (periodResult.recordset.length === 0) {
      return res.status(400).json({ success: false, message: "Hiện chưa có đợt thực tập đang mở." });
    }

    const periodId = periodResult.recordset[0].PeriodId;

    // Verify company exists
    const companyResult = await pool.request()
      .input("CompanyId", sql.Int, companyId)
      .query(`SELECT CompanyId FROM Companies WHERE CompanyId = @CompanyId`);

    if (companyResult.recordset.length === 0) {
      return res.status(400).json({ success: false, message: "Công ty không tồn tại." });
    }

    // Create registration — AUTO APPROVED
    await pool.request()
      .input("StudentId3", sql.Int, studentId)
      .input("CompanyId2", sql.Int, companyId)
      .input("PeriodId", sql.Int, periodId)
      .query(`
        INSERT INTO InternshipRegistrations (StudentId, CompanyId, PeriodId, Status)
        VALUES (@StudentId3, @CompanyId2, @PeriodId, 'APPROVED')
      `);

    res.status(201).json({
      success: true,
      message: "Đăng ký thực tập thành công!",
    });
  } catch (err) {
    next(err);
  }
};


// ─── GET FULL INTERNSHIP INFO (for student dashboard) ─────────────────────
const getMyInternshipInfo = async (req, res, next) => {
  try {
    const pool = await getPool();
    const userId = req.user.userId;

    // Get studentId
    const studentResult = await pool.request()
      .input("UserId", sql.Int, userId)
      .query(`
        SELECT StudentId, StudentCode, FullName, ClassName, Email, Phone, GPA, Status
        FROM Students WHERE UserId = @UserId
      `);

    if (studentResult.recordset.length === 0) {
      return res.status(404).json({ success: false, message: "Không tìm thấy sinh viên." });
    }

    const student = studentResult.recordset[0];
    const studentId = student.StudentId;

    // Get registration + company + period info
    const regResult = await pool.request()
      .input("StudentId", sql.Int, studentId)
      .query(`
        SELECT
          ir.RegistrationId, ir.CompanyId, ir.PeriodId, ir.RegisteredAt, ir.Status AS RegStatus,
          c.CompanyName, c.Address, c.Field, c.ContactPerson, c.ContactEmail, c.ContactPhone,
          p.PeriodName, p.Semester, p.AcademicYear, p.StartDate, p.EndDate, p.Status AS PeriodStatus
        FROM InternshipRegistrations ir
        INNER JOIN Companies c ON ir.CompanyId = c.CompanyId
        INNER JOIN InternshipPeriods p ON ir.PeriodId = p.PeriodId
        WHERE ir.StudentId = @StudentId
      `);

    const registration = regResult.recordset[0] || null;

    if (!registration) {
      return res.json({ success: true, data: { student, registration: null, assignment: null, weeklyReports: [], finalReport: null, evaluation: null } });
    }

    const periodId = registration.PeriodId;

    // Get assignment + lecturer details (with supervised count)
    const assignResult = await pool.request()
      .input("StudentId2", sql.Int, studentId)
      .query(`
        SELECT
          a.AssignmentId, a.AssignedDate,
          l.LecturerId, l.FullName AS LecturerName, l.LecturerCode,
          l.Department, l.Email AS LecturerEmail, l.Phone AS LecturerPhone,
          (SELECT COUNT(*) FROM Assignments WHERE LecturerId = l.LecturerId) AS SupervisedCount
        FROM Assignments a
        INNER JOIN Lecturers l ON a.LecturerId = l.LecturerId
        WHERE a.StudentId = @StudentId2
      `);

    const assignment = assignResult.recordset[0] || null;

    // Get weekly reports
    const weeklyResult = await pool.request()
      .input("StudentId3", sql.Int, studentId)
      .input("PeriodId", sql.Int, periodId)
      .query(`
        SELECT ReportId, WeekNumber, Title, Status, SubmittedAt, LecturerComment
        FROM WeeklyReports
        WHERE StudentId = @StudentId3 AND PeriodId = @PeriodId
        ORDER BY WeekNumber ASC
      `);

    // Get final report
    const finalResult = await pool.request()
      .input("StudentId4", sql.Int, studentId)
      .input("PeriodId2", sql.Int, periodId)
      .query(`
        SELECT FinalReportId, Title, Status, SubmittedAt, LecturerComment
        FROM FinalReports
        WHERE StudentId = @StudentId4 AND PeriodId = @PeriodId2
      `);

    // Get evaluation
    const evalResult = await pool.request()
      .input("StudentId5", sql.Int, studentId)
      .input("PeriodId3", sql.Int, periodId)
      .query(`
        SELECT EvaluationId, ProcessScore, WeeklyReportScore, FinalReportScore, AttitudeScore, TotalScore, Comment, EvaluatedAt
        FROM Evaluations
        WHERE StudentId = @StudentId5 AND PeriodId = @PeriodId3
      `);

    res.json({
      success: true,
      data: {
        student,
        registration,
        assignment,
        weeklyReports: weeklyResult.recordset,
        finalReport: finalResult.recordset[0] || null,
        evaluation: evalResult.recordset[0] || null,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET STUDENT REPORTS ────────────────────────────────────────────────────────
const getStudentReports = async (req, res, next) => {
  try {
    const pool = await getPool();
    const userId = req.user.userId;

    // Get studentId
    const studentResult = await pool.request()
      .input("UserId", sql.Int, userId)
      .query(`SELECT StudentId FROM Students WHERE UserId = @UserId`);

    if (studentResult.recordset.length === 0) {
      return res.status(404).json({ success: false, message: "Không tìm thấy sinh viên." });
    }

    const studentId = studentResult.recordset[0].StudentId;

    // Get active period assignment and reports
    const result = await pool.request()
      .input("StudentId", sql.Int, studentId)
      .query(`
        SELECT 
          rt.TemplateId, rt.Title, rt.ReportType, rt.WeekNumber, rt.OpenDate, rt.DueDate, rt.Description, rt.Status AS TemplateStatus,
          l.FullName AS LecturerName,
          wr.ReportId, wr.Content, wr.FilePath, wr.FileName, wr.FileType, wr.FileSize, wr.Status AS SubmissionStatus, wr.SubmittedAt, wr.LecturerComment,
          p.PeriodName
        FROM Assignments a
        INNER JOIN InternshipPeriods p ON a.PeriodId = p.PeriodId
        INNER JOIN Lecturers l ON a.LecturerId = l.LecturerId
        INNER JOIN ReportTemplates rt ON a.PeriodId = rt.PeriodId AND a.LecturerId = rt.CreatedByLecturerId
        LEFT JOIN WeeklyReports wr ON rt.TemplateId = wr.TemplateId AND a.StudentId = wr.StudentId
        WHERE a.StudentId = @StudentId AND p.Status = 'ACTIVE'
        ORDER BY rt.DueDate ASC
      `);

    res.json({ success: true, data: result.recordset });
  } catch (err) {
    next(err);
  }
};

// ─── SUBMIT REPORT ────────────────────────────────────────────────────────────
const submitReport = async (req, res, next) => {
  try {
    const pool = await getPool();
    const userId = req.user.userId;
    const { TemplateId, Content } = req.body;
    const file = req.file;

    if (!TemplateId) {
      return res.status(400).json({ success: false, message: "Thiếu thông tin mẫu báo cáo." });
    }
    if (!file) {
      return res.status(400).json({ success: false, message: "Vui lòng chọn file báo cáo (PDF, DOCX, ZIP)." });
    }

    // Get studentId
    const studentResult = await pool.request()
      .input("UserId", sql.Int, userId)
      .query(`SELECT StudentId FROM Students WHERE UserId = @UserId`);

    if (studentResult.recordset.length === 0) {
      return res.status(404).json({ success: false, message: "Không tìm thấy sinh viên." });
    }

    const studentId = studentResult.recordset[0].StudentId;

    // Verify template exists and is open
    const templateResult = await pool.request()
      .input("TemplateId", sql.Int, TemplateId)
      .query(`SELECT PeriodId, Status, DueDate, WeekNumber, Title FROM ReportTemplates WHERE TemplateId = @TemplateId`);

    if (templateResult.recordset.length === 0) {
      return res.status(404).json({ success: false, message: "Không tìm thấy mẫu báo cáo." });
    }

    const template = templateResult.recordset[0];
    if (template.Status !== 'OPEN') {
      return res.status(400).json({ success: false, message: "Mẫu báo cáo này đã đóng, không thể nộp." });
    }

    if (new Date() > new Date(template.DueDate)) {
      return res.status(400).json({ success: false, message: "Đã quá hạn nộp báo cáo." });
    }

    const FilePath = `/uploads/${file.filename}`;
    const FileName = file.originalname;
    const FileType = file.mimetype;
    const FileSize = file.size;

    // Check existing submission
    const existingResult = await pool.request()
      .input("TemplateId", sql.Int, TemplateId)
      .input("StudentId", sql.Int, studentId)
      .query(`SELECT ReportId FROM WeeklyReports WHERE TemplateId = @TemplateId AND StudentId = @StudentId`);

    if (existingResult.recordset.length > 0) {
      // Update
      const reportId = existingResult.recordset[0].ReportId;
      await pool.request()
        .input("ReportId", sql.Int, reportId)
        .input("Content", sql.NVarChar, Content || null)
        .input("FilePath", sql.NVarChar, FilePath)
        .input("FileName", sql.NVarChar, FileName)
        .input("FileType", sql.NVarChar, FileType)
        .input("FileSize", sql.BigInt, FileSize)
        .query(`
          UPDATE WeeklyReports 
          SET Content = @Content, FilePath = @FilePath, FileName = @FileName, FileType = @FileType, FileSize = @FileSize, Status = 'PENDING', SubmittedAt = GETDATE()
          WHERE ReportId = @ReportId
        `);
    } else {
      // Insert
      await pool.request()
        .input("StudentId", sql.Int, studentId)
        .input("PeriodId", sql.Int, template.PeriodId)
        .input("TemplateId", sql.Int, TemplateId)
        .input("WeekNumber", sql.Int, template.WeekNumber || 0)
        .input("Title", sql.NVarChar, template.Title)
        .input("Content", sql.NVarChar, Content || null)
        .input("FilePath", sql.NVarChar, FilePath)
        .input("FileName", sql.NVarChar, FileName)
        .input("FileType", sql.NVarChar, FileType)
        .input("FileSize", sql.BigInt, FileSize)
        .query(`
          INSERT INTO WeeklyReports (StudentId, PeriodId, TemplateId, WeekNumber, Title, Content, FilePath, FileName, FileType, FileSize, Status, SubmittedAt)
          VALUES (@StudentId, @PeriodId, @TemplateId, @WeekNumber, @Title, @Content, @FilePath, @FileName, @FileType, @FileSize, 'PENDING', GETDATE())
        `);
    }

    res.json({ success: true, message: "Nộp báo cáo thành công." });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getOpenPeriod,
  getCompanies,
  getMyRegistration,
  registerInternship,
  getMyInternshipInfo,
  getStudentReports,
  submitReport
};
