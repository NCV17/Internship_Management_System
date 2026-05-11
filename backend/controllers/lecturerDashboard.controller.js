const { getPool, sql } = require("../config/db");

// ─── Helper: Get LecturerId from userId ──────────────────────────────────────
const getLecturerIdByUserId = async (pool, userId) => {
  const result = await pool
    .request()
    .input("UserId", sql.Int, userId)
    .query(`SELECT LecturerId FROM Lecturers WHERE UserId = @UserId`);
  if (result.recordset.length === 0) return null;
  return result.recordset[0].LecturerId;
};

// ─── GET /api/lecturer/dashboard ─────────────────────────────────────────────
const getLecturerDashboard = async (req, res, next) => {
  try {
    const pool = await getPool();
    const userId = req.user.userId;

    const lecturerId = await getLecturerIdByUserId(pool, userId);
    if (!lecturerId) {
      return res.status(404).json({ success: false, message: "Lecturer profile not found." });
    }

    // 1. Total students assigned to this lecturer
    const totalStudentsRes = await pool
      .request()
      .input("LecturerId", sql.Int, lecturerId)
      .query(`
        SELECT COUNT(DISTINCT a.StudentId) AS totalStudents
        FROM Assignments a
        WHERE a.LecturerId = @LecturerId
      `);

    // 2. Pending reports (WeeklyReports + FinalReports) for assigned students
    const pendingReportsRes = await pool
      .request()
      .input("LecturerId", sql.Int, lecturerId)
      .query(`
        SELECT COUNT(*) AS pendingReports
        FROM (
          SELECT wr.ReportId
          FROM WeeklyReports wr
          INNER JOIN Assignments a ON wr.StudentId = a.StudentId AND wr.PeriodId = a.PeriodId
          WHERE a.LecturerId = @LecturerId AND wr.Status = 'PENDING'
          UNION ALL
          SELECT fr.FinalReportId AS ReportId
          FROM FinalReports fr
          INNER JOIN Assignments a ON fr.StudentId = a.StudentId AND fr.PeriodId = a.PeriodId
          WHERE a.LecturerId = @LecturerId AND fr.Status = 'PENDING'
        ) AS combined
      `);

    // 3. Reports needing revision
    const revisionReportsRes = await pool
      .request()
      .input("LecturerId", sql.Int, lecturerId)
      .query(`
        SELECT COUNT(*) AS revisionReports
        FROM (
          SELECT wr.ReportId
          FROM WeeklyReports wr
          INNER JOIN Assignments a ON wr.StudentId = a.StudentId AND wr.PeriodId = a.PeriodId
          WHERE a.LecturerId = @LecturerId AND wr.Status = 'REVISION_REQUIRED'
          UNION ALL
          SELECT fr.FinalReportId AS ReportId
          FROM FinalReports fr
          INNER JOIN Assignments a ON fr.StudentId = a.StudentId AND fr.PeriodId = a.PeriodId
          WHERE a.LecturerId = @LecturerId AND fr.Status = 'REVISION_REQUIRED'
        ) AS combined
      `);

    // 4. Evaluated students
    const evaluatedRes = await pool
      .request()
      .input("LecturerId", sql.Int, lecturerId)
      .query(`
        SELECT COUNT(*) AS evaluatedStudents
        FROM Evaluations e
        WHERE e.LecturerId = @LecturerId
      `);

    // 5. Recent submissions (last 10 weekly + final reports)
    const recentSubmissionsRes = await pool
      .request()
      .input("LecturerId", sql.Int, lecturerId)
      .query(`
        SELECT TOP 10
          s.FullName AS studentName,
          s.StudentCode,
          sub.title,
          sub.submittedAt,
          sub.status,
          sub.reportType
        FROM (
          SELECT
            wr.StudentId,
            wr.Title AS title,
            wr.SubmittedAt AS submittedAt,
            wr.Status AS status,
            'WEEKLY' AS reportType
          FROM WeeklyReports wr
          INNER JOIN Assignments a ON wr.StudentId = a.StudentId AND wr.PeriodId = a.PeriodId
          WHERE a.LecturerId = @LecturerId
          UNION ALL
          SELECT
            fr.StudentId,
            fr.Title AS title,
            fr.SubmittedAt AS submittedAt,
            fr.Status AS status,
            'FINAL' AS reportType
          FROM FinalReports fr
          INNER JOIN Assignments a ON fr.StudentId = a.StudentId AND fr.PeriodId = a.PeriodId
          WHERE a.LecturerId = @LecturerId
        ) AS sub
        INNER JOIN Students s ON s.StudentId = sub.StudentId
        ORDER BY sub.submittedAt DESC
      `);

    // 6. Upcoming deadlines (open report templates related to assignments)
    const upcomingDeadlinesRes = await pool
      .request()
      .input("LecturerId", sql.Int, lecturerId)
      .query(`
        SELECT TOP 5
          rt.TemplateId,
          rt.Title,
          rt.ReportType,
          rt.DueDate,
          DATEDIFF(day, GETDATE(), rt.DueDate) AS remainingDays,
          ip.PeriodName
        FROM ReportTemplates rt
        INNER JOIN InternshipPeriods ip ON rt.PeriodId = ip.PeriodId
        WHERE rt.Status = 'OPEN'
          AND rt.DueDate >= GETDATE()
          AND rt.PeriodId IN (
            SELECT DISTINCT a.PeriodId FROM Assignments a WHERE a.LecturerId = @LecturerId
          )
        ORDER BY rt.DueDate ASC
      `);

    // 7. Lecturer info + active period
    const lecturerInfoRes = await pool
      .request()
      .input("LecturerId", sql.Int, lecturerId)
      .query(`
        SELECT l.FullName, l.Department, l.LecturerCode, l.Email, l.Phone
        FROM Lecturers l
        WHERE l.LecturerId = @LecturerId
      `);

    const activePeriodRes = await pool
      .request()
      .query(`
        SELECT TOP 1 PeriodId, PeriodName, Semester, AcademicYear, StartDate, EndDate
        FROM InternshipPeriods
        WHERE Status = 'ACTIVE'
        ORDER BY StartDate DESC
      `);

    return res.status(200).json({
      success: true,
      data: {
        lecturer: lecturerInfoRes.recordset[0] || null,
        activePeriod: activePeriodRes.recordset[0] || null,
        totalStudents: totalStudentsRes.recordset[0]?.totalStudents || 0,
        pendingReports: pendingReportsRes.recordset[0]?.pendingReports || 0,
        revisionReports: revisionReportsRes.recordset[0]?.revisionReports || 0,
        evaluatedStudents: evaluatedRes.recordset[0]?.evaluatedStudents || 0,
        recentSubmissions: recentSubmissionsRes.recordset,
        upcomingDeadlines: upcomingDeadlinesRes.recordset,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/lecturer/students ───────────────────────────────────────────────
const getLecturerStudents = async (req, res, next) => {
  try {
    const pool = await getPool();
    const userId = req.user.userId;

    const lecturerId = await getLecturerIdByUserId(pool, userId);
    if (!lecturerId) {
      return res.status(404).json({ success: false, message: "Lecturer profile not found." });
    }

    const { search, studentCode, status, periodId, companyId } = req.query;

    let whereConditions = ["a.LecturerId = @LecturerId"];
    if (search) whereConditions.push(`(s.FullName LIKE @Search OR s.StudentCode LIKE @Search)`);
    if (studentCode) whereConditions.push(`s.StudentCode LIKE @StudentCode`);
    if (status) whereConditions.push(`s.Status = @Status`);
    if (periodId) whereConditions.push(`a.PeriodId = @PeriodId`);
    if (companyId) whereConditions.push(`ir.CompanyId = @CompanyId`);

    const whereClause = "WHERE " + whereConditions.join(" AND ");

    const request = pool.request().input("LecturerId", sql.Int, lecturerId);
    if (search) request.input("Search", sql.NVarChar, `%${search}%`);
    if (studentCode) request.input("StudentCode", sql.NVarChar, `%${studentCode}%`);
    if (status) request.input("Status", sql.NVarChar, status);
    if (periodId) request.input("PeriodId", sql.Int, parseInt(periodId));
    if (companyId) request.input("CompanyId", sql.Int, parseInt(companyId));

    const studentsRes = await request.query(`
      SELECT
        s.StudentId,
        s.StudentCode,
        s.FullName,
        s.ClassName,
        s.Email,
        s.Status AS internshipStatus,
        a.PeriodId,
        a.AssignmentId,
        ip.PeriodName,
        ip.StartDate,
        ip.EndDate,
        c.CompanyId,
        c.CompanyName,
        ISNULL(prog.ProgressPercent, 0) AS progressPercent,
        (
          SELECT COUNT(*)
          FROM WeeklyReports wr
          WHERE wr.StudentId = s.StudentId AND wr.PeriodId = a.PeriodId
        ) AS weeklyReportCount,
        (
          SELECT COUNT(*)
          FROM FinalReports fr
          WHERE fr.StudentId = s.StudentId AND fr.PeriodId = a.PeriodId
        ) AS finalReportCount,
        (
          SELECT COUNT(*)
          FROM Evaluations e
          WHERE e.StudentId = s.StudentId AND e.LecturerId = @LecturerId
        ) AS hasEvaluation
      FROM Assignments a
      INNER JOIN Students s ON a.StudentId = s.StudentId
      INNER JOIN InternshipPeriods ip ON a.PeriodId = ip.PeriodId
      LEFT JOIN InternshipRegistrations ir ON ir.StudentId = s.StudentId AND ir.PeriodId = a.PeriodId
      LEFT JOIN Companies c ON ir.CompanyId = c.CompanyId
      LEFT JOIN InternshipProgress prog ON prog.StudentId = s.StudentId AND prog.PeriodId = a.PeriodId
      ${whereClause}
      ORDER BY s.FullName ASC
    `);

    const students = studentsRes.recordset.map((row) => ({
      studentId: row.StudentId,
      studentCode: row.StudentCode,
      fullName: row.FullName,
      className: row.ClassName,
      email: row.Email,
      internshipStatus: row.internshipStatus,
      periodId: row.PeriodId,
      assignmentId: row.AssignmentId,
      periodName: row.PeriodName,
      startDate: row.StartDate,
      endDate: row.EndDate,
      companyId: row.CompanyId,
      companyName: row.CompanyName,
      progressPercent: row.progressPercent,
      submittedReports: row.weeklyReportCount + row.finalReportCount,
      weeklyReportCount: row.weeklyReportCount,
      finalReportCount: row.finalReportCount,
      hasEvaluation: row.hasEvaluation > 0,
    }));

    return res.status(200).json({ success: true, data: students });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/lecturer/students/:id ──────────────────────────────────────────
const getLecturerStudentDetail = async (req, res, next) => {
  try {
    const pool = await getPool();
    const userId = req.user.userId;
    const studentId = parseInt(req.params.id);

    const lecturerId = await getLecturerIdByUserId(pool, userId);
    if (!lecturerId) {
      return res.status(404).json({ success: false, message: "Lecturer profile not found." });
    }

    // Security: check that this student is assigned to this lecturer
    const assignCheck = await pool
      .request()
      .input("LecturerId", sql.Int, lecturerId)
      .input("StudentId", sql.Int, studentId)
      .query(`
        SELECT a.AssignmentId, a.PeriodId
        FROM Assignments a
        WHERE a.LecturerId = @LecturerId AND a.StudentId = @StudentId
      `);

    if (assignCheck.recordset.length === 0) {
      return res.status(403).json({ success: false, message: "Access denied. Student not assigned to you." });
    }

    const { PeriodId } = assignCheck.recordset[0];

    // Student profile
    const studentRes = await pool
      .request()
      .input("StudentId", sql.Int, studentId)
      .query(`
        SELECT StudentId, StudentCode, FullName, ClassName, Email, Phone, Status, GPA
        FROM Students WHERE StudentId = @StudentId
      `);

    // Internship registration
    const regRes = await pool
      .request()
      .input("StudentId", sql.Int, studentId)
      .input("PeriodId", sql.Int, PeriodId)
      .query(`
        SELECT ir.RegistrationId, ir.RegisteredAt, ir.Status AS regStatus,
               c.CompanyId, c.CompanyName, c.Address, c.Field, c.ContactPerson, c.ContactEmail
        FROM InternshipRegistrations ir
        LEFT JOIN Companies c ON ir.CompanyId = c.CompanyId
        WHERE ir.StudentId = @StudentId AND ir.PeriodId = @PeriodId
      `);

    // Internship period
    const periodRes = await pool
      .request()
      .input("PeriodId", sql.Int, PeriodId)
      .query(`
        SELECT PeriodId, PeriodName, Semester, AcademicYear, StartDate, EndDate, Status
        FROM InternshipPeriods WHERE PeriodId = @PeriodId
      `);

    // Progress
    const progressRes = await pool
      .request()
      .input("StudentId", sql.Int, studentId)
      .input("PeriodId", sql.Int, PeriodId)
      .query(`
        SELECT ProgressPercent, CurrentStage, InternshipStatus, Notes, UpdatedAt
        FROM InternshipProgress
        WHERE StudentId = @StudentId AND PeriodId = @PeriodId
      `);

    // Weekly reports
    const weeklyRes = await pool
      .request()
      .input("StudentId", sql.Int, studentId)
      .input("PeriodId", sql.Int, PeriodId)
      .query(`
        SELECT wr.ReportId, wr.Title, wr.Status, wr.SubmittedAt, wr.LecturerComment,
               rt.WeekNumber, rt.DueDate
        FROM WeeklyReports wr
        LEFT JOIN ReportTemplates rt ON wr.TemplateId = rt.TemplateId
        WHERE wr.StudentId = @StudentId AND wr.PeriodId = @PeriodId
        ORDER BY wr.SubmittedAt DESC
      `);

    // Final report
    const finalRes = await pool
      .request()
      .input("StudentId", sql.Int, studentId)
      .input("PeriodId", sql.Int, PeriodId)
      .query(`
        SELECT FinalReportId, Title, Status, SubmittedAt, LecturerComment
        FROM FinalReports
        WHERE StudentId = @StudentId AND PeriodId = @PeriodId
      `);

    // Evaluation
    const evalRes = await pool
      .request()
      .input("StudentId", sql.Int, studentId)
      .input("LecturerId", sql.Int, lecturerId)
      .query(`
        SELECT EvaluationId, ProcessScore, WeeklyReportScore, FinalReportScore,
               AttitudeScore, TotalScore, Comment, EvaluatedAt
        FROM Evaluations
        WHERE StudentId = @StudentId AND LecturerId = @LecturerId
      `);

    return res.status(200).json({
      success: true,
      data: {
        student: studentRes.recordset[0] || null,
        registration: regRes.recordset[0] || null,
        period: periodRes.recordset[0] || null,
        progress: progressRes.recordset[0] || null,
        weeklyReports: weeklyRes.recordset,
        finalReport: finalRes.recordset[0] || null,
        evaluation: evalRes.recordset[0] || null,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/lecturer/filter-options ────────────────────────────────────────
const getLecturerFilterOptions = async (req, res, next) => {
  try {
    const pool = await getPool();
    const userId = req.user.userId;

    const lecturerId = await getLecturerIdByUserId(pool, userId);
    if (!lecturerId) {
      return res.status(404).json({ success: false, message: "Lecturer profile not found." });
    }

    // Periods assigned to this lecturer
    const periodsRes = await pool
      .request()
      .input("LecturerId", sql.Int, lecturerId)
      .query(`
        SELECT DISTINCT ip.PeriodId, ip.PeriodName
        FROM Assignments a
        INNER JOIN InternshipPeriods ip ON a.PeriodId = ip.PeriodId
        WHERE a.LecturerId = @LecturerId
        ORDER BY ip.PeriodName
      `);

    // Companies for assigned students
    const companiesRes = await pool
      .request()
      .input("LecturerId", sql.Int, lecturerId)
      .query(`
        SELECT DISTINCT c.CompanyId, c.CompanyName
        FROM Assignments a
        INNER JOIN InternshipRegistrations ir ON ir.StudentId = a.StudentId AND ir.PeriodId = a.PeriodId
        INNER JOIN Companies c ON ir.CompanyId = c.CompanyId
        WHERE a.LecturerId = @LecturerId
        ORDER BY c.CompanyName
      `);

    return res.status(200).json({
      success: true,
      data: {
        periods: periodsRes.recordset,
        companies: companiesRes.recordset,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── PUT /api/lecturer/students/:studentId/reports/weekly/:reportId/review ───
const reviewWeeklyReport = async (req, res, next) => {
  try {
    const pool = await getPool();
    const userId = req.user.userId;
    const { studentId, reportId } = req.params;
    const { status, score, lecturerComment } = req.body;

    const lecturerId = await getLecturerIdByUserId(pool, userId);
    if (!lecturerId) return res.status(404).json({ success: false, message: "Lecturer not found." });

    // Verify assignment
    const check = await pool.request()
      .input("LecturerId", sql.Int, lecturerId)
      .input("StudentId", sql.Int, parseInt(studentId))
      .query(`SELECT 1 FROM Assignments a WHERE a.LecturerId = @LecturerId AND a.StudentId = @StudentId`);
    if (check.recordset.length === 0)
      return res.status(403).json({ success: false, message: "Access denied." });

    const req2 = pool.request()
      .input("ReportId", sql.Int, parseInt(reportId))
      .input("StudentId", sql.Int, parseInt(studentId))
      .input("Status", sql.NVarChar, status)
      .input("LecturerComment", sql.NVarChar, lecturerComment || null);

    // Try with Score column first
    try {
      req2.input("Score", sql.Float, score != null ? parseFloat(score) : null);
      await req2.query(`
        UPDATE WeeklyReports
        SET Status = @Status, LecturerComment = @LecturerComment,
            Score = @Score, ReviewedAt = GETDATE()
        WHERE ReportId = @ReportId AND StudentId = @StudentId
      `);
    } catch {
      await pool.request()
        .input("ReportId", sql.Int, parseInt(reportId))
        .input("StudentId", sql.Int, parseInt(studentId))
        .input("Status", sql.NVarChar, status)
        .input("LecturerComment", sql.NVarChar, lecturerComment || null)
        .query(`
          UPDATE WeeklyReports
          SET Status = @Status, LecturerComment = @LecturerComment
          WHERE ReportId = @ReportId AND StudentId = @StudentId
        `);
    }

    return res.status(200).json({ success: true, message: "Report reviewed." });
  } catch (err) { next(err); }
};

// ─── POST /api/lecturer/students/:studentId/evaluate ─────────────────────────
const evaluateStudent = async (req, res, next) => {
  try {
    const pool = await getPool();
    const userId = req.user.userId;
    const { studentId } = req.params;
    const { periodId, processScore, weeklyReportScore, finalReportScore, attitudeScore, totalScore, comment } = req.body;

    const lecturerId = await getLecturerIdByUserId(pool, userId);
    if (!lecturerId) return res.status(404).json({ success: false, message: "Lecturer not found." });

    const existing = await pool.request()
      .input("StudentId", sql.Int, parseInt(studentId))
      .input("LecturerId", sql.Int, lecturerId)
      .query(`SELECT EvaluationId FROM Evaluations WHERE StudentId = @StudentId AND LecturerId = @LecturerId`);

    if (existing.recordset.length > 0) {
      await pool.request()
        .input("EvaluationId", sql.Int, existing.recordset[0].EvaluationId)
        .input("ProcessScore", sql.Float, parseFloat(processScore) || 0)
        .input("WeeklyReportScore", sql.Float, parseFloat(weeklyReportScore) || 0)
        .input("FinalReportScore", sql.Float, parseFloat(finalReportScore) || 0)
        .input("AttitudeScore", sql.Float, parseFloat(attitudeScore) || 0)
        .input("TotalScore", sql.Float, parseFloat(totalScore) || 0)
        .input("Comment", sql.NVarChar, comment || null)
        .query(`
          UPDATE Evaluations
          SET ProcessScore=@ProcessScore, WeeklyReportScore=@WeeklyReportScore,
              FinalReportScore=@FinalReportScore, AttitudeScore=@AttitudeScore,
              TotalScore=@TotalScore, Comment=@Comment, EvaluatedAt=GETDATE()
          WHERE EvaluationId=@EvaluationId
        `);
    } else {
      await pool.request()
        .input("StudentId", sql.Int, parseInt(studentId))
        .input("LecturerId", sql.Int, lecturerId)
        .input("PeriodId", sql.Int, parseInt(periodId))
        .input("ProcessScore", sql.Float, parseFloat(processScore) || 0)
        .input("WeeklyReportScore", sql.Float, parseFloat(weeklyReportScore) || 0)
        .input("FinalReportScore", sql.Float, parseFloat(finalReportScore) || 0)
        .input("AttitudeScore", sql.Float, parseFloat(attitudeScore) || 0)
        .input("TotalScore", sql.Float, parseFloat(totalScore) || 0)
        .input("Comment", sql.NVarChar, comment || null)
        .query(`
          INSERT INTO Evaluations (StudentId, LecturerId, PeriodId, ProcessScore, WeeklyReportScore,
            FinalReportScore, AttitudeScore, TotalScore, Comment, EvaluatedAt)
          VALUES (@StudentId, @LecturerId, @PeriodId, @ProcessScore, @WeeklyReportScore,
            @FinalReportScore, @AttitudeScore, @TotalScore, @Comment, GETDATE())
        `);
    }

    return res.status(200).json({ success: true, message: "Evaluation saved." });
  } catch (err) { next(err); }
};

// ─── GET /api/lecturer/evaluations?periodId=X ────────────────────────────────
const getEvaluationStudents = async (req, res, next) => {
  try {
    const pool = await getPool();
    const userId = req.user.userId;
    const { periodId } = req.query;

    const lecturerId = await getLecturerIdByUserId(pool, userId);
    if (!lecturerId) return res.status(404).json({ success: false, message: "Lecturer not found." });

    let whereExtra = "";
    const request = pool.request().input("LecturerId", sql.Int, lecturerId);
    if (periodId) {
      whereExtra = "AND a.PeriodId = @PeriodId";
      request.input("PeriodId", sql.Int, parseInt(periodId));
    }

    const result = await request.query(`
      SELECT
        s.StudentId, s.StudentCode, s.FullName, s.ClassName, s.Email,
        a.PeriodId, ip.PeriodName,
        c.CompanyName,
        (SELECT COUNT(*) FROM WeeklyReports wr WHERE wr.StudentId = s.StudentId AND wr.PeriodId = a.PeriodId) +
        (SELECT COUNT(*) FROM FinalReports fr WHERE fr.StudentId = s.StudentId AND fr.PeriodId = a.PeriodId) AS submittedReports,
        e.EvaluationId, e.ProcessScore, e.WeeklyReportScore, e.FinalReportScore,
        e.AttitudeScore, e.TotalScore, e.Comment, e.EvaluatedAt
      FROM Assignments a
      INNER JOIN Students s ON a.StudentId = s.StudentId
      INNER JOIN InternshipPeriods ip ON a.PeriodId = ip.PeriodId
      LEFT JOIN InternshipRegistrations ir ON ir.StudentId = s.StudentId AND ir.PeriodId = a.PeriodId
      LEFT JOIN Companies c ON ir.CompanyId = c.CompanyId
      LEFT JOIN Evaluations e ON e.StudentId = s.StudentId AND e.PeriodId = a.PeriodId AND e.LecturerId = @LecturerId
      WHERE a.LecturerId = @LecturerId ${whereExtra}
      ORDER BY e.EvaluationId ASC, s.FullName ASC
    `);

    return res.status(200).json({ success: true, data: result.recordset });
  } catch (err) { next(err); }
};

// ─── GET /api/student/evaluation-result ──────────────────────────────────────
const getStudentEvaluationResult = async (req, res, next) => {
  try {
    const pool = await getPool();
    const userId = req.user.userId;

    const studentRes = await pool.request()
      .input("UserId", sql.Int, userId)
      .query(`SELECT StudentId FROM Students WHERE UserId = @UserId`);
    if (studentRes.recordset.length === 0)
      return res.status(404).json({ success: false, message: "Student not found." });
    const studentId = studentRes.recordset[0].StudentId;

    const result = await pool.request()
      .input("StudentId", sql.Int, studentId)
      .query(`
        SELECT e.EvaluationId, e.ProcessScore, e.WeeklyReportScore, e.FinalReportScore,
               e.AttitudeScore, e.TotalScore, e.Comment, e.EvaluatedAt,
               l.FullName AS LecturerName, l.Department,
               ip.PeriodName, ip.Semester, ip.AcademicYear
        FROM Evaluations e
        INNER JOIN Lecturers l ON e.LecturerId = l.LecturerId
        INNER JOIN InternshipPeriods ip ON e.PeriodId = ip.PeriodId
        WHERE e.StudentId = @StudentId
        ORDER BY e.EvaluatedAt DESC
      `);

    return res.status(200).json({ success: true, data: result.recordset });
  } catch (err) { next(err); }
};

module.exports = {
  getLecturerDashboard,
  getLecturerStudents,
  getLecturerStudentDetail,
  getLecturerFilterOptions,
  reviewWeeklyReport,
  evaluateStudent,
  getEvaluationStudents,
  getStudentEvaluationResult,
};
