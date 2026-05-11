const { getPool, sql } = require("../config/db");

const getOverview = async (req, res, next) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT 
        (SELECT COUNT(*) FROM Lecturers) as TotalLecturers,
        (SELECT COUNT(*) FROM Students) as TotalStudents,
        (SELECT COUNT(*) FROM Companies) as TotalCompanies,
        (SELECT COUNT(*) FROM InternshipPeriods WHERE Status = 'ACTIVE') as ActivePeriods,
        (SELECT COUNT(*) FROM Assignments) as AssignedStudents,
        (SELECT COUNT(*) FROM Students s LEFT JOIN Assignments a ON s.StudentId = a.StudentId WHERE a.AssignmentId IS NULL) as UnassignedStudents
    `);
    
    res.json({ success: true, data: result.recordset[0] });
  } catch (err) {
    next(err);
  }
};

const getStatusSummary = async (req, res, next) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT 
        ISNULL(InternshipStatus, 'NOT_STARTED') as Status, 
        COUNT(*) as Count
      FROM InternshipProgress
      GROUP BY InternshipStatus
    `);
    
    // Fill missing statuses
    let notStarted = 0, inProgress = 0, completed = 0;
    result.recordset.forEach(r => {
      if (r.Status === 'NOT_STARTED') notStarted = r.Count;
      if (r.Status === 'IN_PROGRESS') inProgress = r.Count;
      if (r.Status === 'COMPLETED') completed = r.Count;
    });

    res.json({
      success: true,
      data: { notStarted, inProgress, completed }
    });
  } catch (err) {
    next(err);
  }
};

const getTopCompanies = async (req, res, next) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT TOP 5
        c.CompanyName as name,
        COUNT(ir.StudentId) as students
      FROM Companies c
      INNER JOIN InternshipRegistrations ir ON c.CompanyId = ir.CompanyId
      WHERE ir.Status = 'APPROVED'
      GROUP BY c.CompanyName
      ORDER BY students DESC
    `);
    
    res.json({ success: true, data: result.recordset });
  } catch (err) {
    next(err);
  }
};

const getLecturerWorkload = async (req, res, next) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT TOP 10
        l.LecturerCode as code,
        l.FullName as name,
        COUNT(a.StudentId) as count
      FROM Lecturers l
      INNER JOIN Assignments a ON l.LecturerId = a.LecturerId
      GROUP BY l.LecturerCode, l.FullName
      ORDER BY count DESC
    `);
    
    res.json({ success: true, data: result.recordset });
  } catch (err) {
    next(err);
  }
};

const getCurrentPeriod = async (req, res, next) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT TOP 1
        p.PeriodId, p.PeriodName, p.Semester, p.AcademicYear, p.StartDate,
        (SELECT COUNT(DISTINCT StudentId) FROM InternshipRegistrations WHERE PeriodId = p.PeriodId) as StudentCount,
        (SELECT COUNT(DISTINCT LecturerId) FROM Assignments WHERE PeriodId = p.PeriodId) as LecturerCount,
        (SELECT COUNT(DISTINCT CompanyId) FROM InternshipRegistrations WHERE PeriodId = p.PeriodId) as CompanyCount
      FROM InternshipPeriods p
      WHERE p.Status = 'ACTIVE'
      ORDER BY p.StartDate DESC
    `);
    
    res.json({ success: true, data: result.recordset[0] || null });
  } catch (err) {
    next(err);
  }
};

const getRecentActivities = async (req, res, next) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT TOP 10 activity, actorName, createdAt FROM (
        SELECT
          N'Sinh viên đăng ký thực tập' AS activity,
          s.FullName AS actorName,
          ir.RegisteredAt AS createdAt
        FROM InternshipRegistrations ir
        INNER JOIN Students s ON ir.StudentId = s.StudentId

        UNION ALL

        SELECT
          N'Phân công giảng viên hướng dẫn' AS activity,
          s.FullName AS actorName,
          a.AssignedDate AS createdAt
        FROM Assignments a
        INNER JOIN Students s ON a.StudentId = s.StudentId

        UNION ALL

        SELECT
          N'Sinh viên nộp báo cáo tuần' AS activity,
          s.FullName AS actorName,
          wr.SubmittedAt AS createdAt
        FROM WeeklyReports wr
        INNER JOIN Students s ON wr.StudentId = s.StudentId

        UNION ALL

        SELECT
          N'Sinh viên nộp báo cáo tổng kết' AS activity,
          s.FullName AS actorName,
          fr.SubmittedAt AS createdAt
        FROM FinalReports fr
        INNER JOIN Students s ON fr.StudentId = s.StudentId
      ) AS combined
      ORDER BY createdAt DESC
    `);
    res.json({ success: true, data: result.recordset });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getOverview,
  getStatusSummary,
  getTopCompanies,
  getLecturerWorkload,
  getCurrentPeriod,
  getRecentActivities
};
