const { getPool, sql } = require("../config/db");

// Helper: Get LecturerId from userId
const getLecturerIdByUserId = async (pool, userId) => {
  const result = await pool
    .request()
    .input("UserId", sql.Int, userId)
    .query(`SELECT LecturerId FROM Lecturers WHERE UserId = @UserId`);
  if (result.recordset.length === 0) return null;
  return result.recordset[0].LecturerId;
};

// ─── GET PERIODS ─────────────────────────────────────────────────────────────
const getPeriods = async (req, res, next) => {
  try {
    const pool = await getPool();
    const userId = req.user.userId;
    const lecturerId = await getLecturerIdByUserId(pool, userId);
    
    if (!lecturerId) return res.status(404).json({ success: false, message: "Lecturer not found" });

    const result = await pool.request()
      .input("LecturerId", sql.Int, lecturerId)
      .query(`
        SELECT DISTINCT ip.PeriodId, ip.PeriodName, ip.Semester, ip.AcademicYear, ip.Status
        FROM Assignments a
        INNER JOIN InternshipPeriods ip ON a.PeriodId = ip.PeriodId
        WHERE a.LecturerId = @LecturerId
        ORDER BY ip.PeriodId DESC
      `);
      
    res.status(200).json({ success: true, data: result.recordset });
  } catch (err) {
    next(err);
  }
};

// ─── GET TEMPLATES ───────────────────────────────────────────────────────────
const getTemplates = async (req, res, next) => {
  try {
    const pool = await getPool();
    const userId = req.user.userId;
    const lecturerId = await getLecturerIdByUserId(pool, userId);
    const periodId = req.query.periodId;

    if (!lecturerId) return res.status(404).json({ success: false, message: "Lecturer not found" });
    if (!periodId) return res.status(400).json({ success: false, message: "PeriodId is required" });

    const result = await pool.request()
      .input("LecturerId", sql.Int, lecturerId)
      .input("PeriodId", sql.Int, periodId)
      .query(`
        SELECT rt.*,
          (SELECT COUNT(*) FROM WeeklyReports wr INNER JOIN Assignments a ON wr.StudentId = a.StudentId AND wr.PeriodId = a.PeriodId
           WHERE wr.TemplateId = rt.TemplateId AND a.LecturerId = @LecturerId) AS TotalSubmissions,
          (SELECT COUNT(*) FROM WeeklyReports wr INNER JOIN Assignments a ON wr.StudentId = a.StudentId AND wr.PeriodId = a.PeriodId
           WHERE wr.TemplateId = rt.TemplateId AND a.LecturerId = @LecturerId AND wr.Status = 'PENDING') AS PendingCount
        FROM ReportTemplates rt
        WHERE rt.PeriodId = @PeriodId AND rt.CreatedByLecturerId = @LecturerId
        ORDER BY rt.DueDate DESC
      `);

    res.status(200).json({ success: true, data: result.recordset });
  } catch (err) {
    next(err);
  }
};

// ─── CREATE TEMPLATE ─────────────────────────────────────────────────────────
const createTemplate = async (req, res, next) => {
  try {
    const pool = await getPool();
    const userId = req.user.userId;
    const lecturerId = await getLecturerIdByUserId(pool, userId);
    const { PeriodId, Title, ReportType, WeekNumber, OpenDate, DueDate, Description } = req.body;

    if (!lecturerId) return res.status(404).json({ success: false, message: "Lecturer not found" });
    if (!PeriodId || !Title || !ReportType || !OpenDate || !DueDate) {
        return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    // Verify period is active
    const periodCheck = await pool.request()
      .input("PeriodId", sql.Int, PeriodId)
      .query(`SELECT Status FROM InternshipPeriods WHERE PeriodId = @PeriodId`);
      
    if (periodCheck.recordset.length === 0 || periodCheck.recordset[0].Status === 'CLOSED') {
      return res.status(400).json({ success: false, message: "Cannot create template in a closed period" });
    }

    const result = await pool.request()
      .input("PeriodId", sql.Int, PeriodId)
      .input("Title", sql.NVarChar, Title)
      .input("ReportType", sql.NVarChar, ReportType)
      .input("WeekNumber", sql.Int, WeekNumber || null)
      .input("OpenDate", sql.DateTime, new Date(OpenDate))
      .input("DueDate", sql.DateTime, new Date(DueDate))
      .input("Description", sql.NVarChar, Description || null)
      .input("CreatedByLecturerId", sql.Int, lecturerId)
      .query(`
        INSERT INTO ReportTemplates (PeriodId, Title, ReportType, WeekNumber, OpenDate, DueDate, Description, CreatedByLecturerId)
        OUTPUT INSERTED.*
        VALUES (@PeriodId, @Title, @ReportType, @WeekNumber, @OpenDate, @DueDate, @Description, @CreatedByLecturerId)
      `);

    res.status(201).json({ success: true, data: result.recordset[0] });
  } catch (err) {
    next(err);
  }
};

// ─── UPDATE TEMPLATE ─────────────────────────────────────────────────────────
const updateTemplate = async (req, res, next) => {
  try {
    const pool = await getPool();
    const userId = req.user.userId;
    const lecturerId = await getLecturerIdByUserId(pool, userId);
    const { id } = req.params;
    const { Title, ReportType, WeekNumber, OpenDate, DueDate, Description, Status } = req.body;

    if (!lecturerId) return res.status(404).json({ success: false, message: "Lecturer not found" });

    // Verify ownership
    const check = await pool.request()
      .input("TemplateId", sql.Int, id)
      .input("LecturerId", sql.Int, lecturerId)
      .query(`SELECT PeriodId FROM ReportTemplates WHERE TemplateId = @TemplateId AND CreatedByLecturerId = @LecturerId`);
      
    if (check.recordset.length === 0) {
      return res.status(403).json({ success: false, message: "Not authorized to update this template" });
    }
    
    // Check if period is closed
    const periodId = check.recordset[0].PeriodId;
    const periodCheck = await pool.request()
      .input("PeriodId", sql.Int, periodId)
      .query(`SELECT Status FROM InternshipPeriods WHERE PeriodId = @PeriodId`);
      
    if (periodCheck.recordset[0].Status === 'CLOSED') {
      return res.status(400).json({ success: false, message: "Cannot edit template in a closed period" });
    }

    let updateFields = [];
    const request = pool.request().input("TemplateId", sql.Int, id);

    if (Title !== undefined) { updateFields.push("Title = @Title"); request.input("Title", sql.NVarChar, Title); }
    if (ReportType !== undefined) { updateFields.push("ReportType = @ReportType"); request.input("ReportType", sql.NVarChar, ReportType); }
    if (WeekNumber !== undefined) { updateFields.push("WeekNumber = @WeekNumber"); request.input("WeekNumber", sql.Int, WeekNumber || null); }
    if (OpenDate !== undefined) { updateFields.push("OpenDate = @OpenDate"); request.input("OpenDate", sql.DateTime, new Date(OpenDate)); }
    if (DueDate !== undefined) { updateFields.push("DueDate = @DueDate"); request.input("DueDate", sql.DateTime, new Date(DueDate)); }
    if (Description !== undefined) { updateFields.push("Description = @Description"); request.input("Description", sql.NVarChar, Description || null); }
    if (Status !== undefined) { updateFields.push("Status = @Status"); request.input("Status", sql.NVarChar, Status); }

    if (updateFields.length === 0) return res.status(400).json({ success: false, message: "No fields to update" });

    const result = await request.query(`
      UPDATE ReportTemplates
      SET ${updateFields.join(", ")}
      OUTPUT INSERTED.*
      WHERE TemplateId = @TemplateId
    `);

    res.status(200).json({ success: true, data: result.recordset[0] });
  } catch (err) {
    next(err);
  }
};

// ─── DELETE TEMPLATE ─────────────────────────────────────────────────────────
const deleteTemplate = async (req, res, next) => {
    try {
        const pool = await getPool();
        const userId = req.user.userId;
        const lecturerId = await getLecturerIdByUserId(pool, userId);
        const { id } = req.params;
    
        if (!lecturerId) return res.status(404).json({ success: false, message: "Lecturer not found" });
    
        // Verify ownership
        const check = await pool.request()
          .input("TemplateId", sql.Int, id)
          .input("LecturerId", sql.Int, lecturerId)
          .query(`SELECT PeriodId FROM ReportTemplates WHERE TemplateId = @TemplateId AND CreatedByLecturerId = @LecturerId`);
          
        if (check.recordset.length === 0) {
          return res.status(403).json({ success: false, message: "Not authorized to delete this template" });
        }

        // Check if there are submissions
        const submissionsCheck = await pool.request()
            .input("TemplateId", sql.Int, id)
            .query(`SELECT COUNT(*) as count FROM WeeklyReports WHERE TemplateId = @TemplateId`);
        
        if (submissionsCheck.recordset[0].count > 0) {
            return res.status(400).json({ success: false, message: "Cannot delete template with existing submissions" });
        }

        // Check if period is closed
        const periodId = check.recordset[0].PeriodId;
        const periodCheck = await pool.request()
            .input("PeriodId", sql.Int, periodId)
            .query(`SELECT Status FROM InternshipPeriods WHERE PeriodId = @PeriodId`);
            
        if (periodCheck.recordset[0].Status === 'CLOSED') {
            return res.status(400).json({ success: false, message: "Cannot delete template in a closed period" });
        }
    
        await pool.request()
          .input("TemplateId", sql.Int, id)
          .query(`DELETE FROM ReportTemplates WHERE TemplateId = @TemplateId`);
    
        res.status(200).json({ success: true, message: "Template deleted" });
    } catch (err) {
        next(err);
    }
};

// ─── GET SUBMISSIONS ─────────────────────────────────────────────────────────
const getSubmissions = async (req, res, next) => {
  try {
    const pool = await getPool();
    const userId = req.user.userId;
    const lecturerId = await getLecturerIdByUserId(pool, userId);
    const templateId = req.query.templateId;

    if (!lecturerId) return res.status(404).json({ success: false, message: "Lecturer not found" });
    if (!templateId) return res.status(400).json({ success: false, message: "TemplateId is required" });

    // Verify ownership of the template or period
    const check = await pool.request()
      .input("TemplateId", sql.Int, templateId)
      .input("LecturerId", sql.Int, lecturerId)
      .query(`SELECT PeriodId FROM ReportTemplates WHERE TemplateId = @TemplateId AND CreatedByLecturerId = @LecturerId`);
      
    if (check.recordset.length === 0) {
      return res.status(403).json({ success: false, message: "Not authorized to view submissions for this template" });
    }

    const result = await pool.request()
      .input("TemplateId", sql.Int, templateId)
      .input("LecturerId", sql.Int, lecturerId)
      .query(`
        SELECT wr.*, s.FullName, s.StudentCode
        FROM WeeklyReports wr
        INNER JOIN Students s ON wr.StudentId = s.StudentId
        INNER JOIN Assignments a ON a.StudentId = s.StudentId AND a.PeriodId = wr.PeriodId
        WHERE wr.TemplateId = @TemplateId AND a.LecturerId = @LecturerId
        ORDER BY wr.SubmittedAt DESC
      `);

    res.status(200).json({ success: true, data: result.recordset });
  } catch (err) {
    next(err);
  }
};

// ─── REVIEW SUBMISSION ───────────────────────────────────────────────────────
const reviewSubmission = async (req, res, next) => {
  try {
    const pool = await getPool();
    const userId = req.user.userId;
    const lecturerId = await getLecturerIdByUserId(pool, userId);
    const { id } = req.params;
    const { Status, LecturerComment } = req.body;

    if (!lecturerId) return res.status(404).json({ success: false, message: "Lecturer not found" });

    // Verify ownership of the student assignment
    const check = await pool.request()
      .input("ReportId", sql.Int, id)
      .input("LecturerId", sql.Int, lecturerId)
      .query(`
        SELECT wr.PeriodId 
        FROM WeeklyReports wr
        INNER JOIN Assignments a ON wr.StudentId = a.StudentId AND wr.PeriodId = a.PeriodId
        WHERE wr.ReportId = @ReportId AND a.LecturerId = @LecturerId
      `);
      
    if (check.recordset.length === 0) {
      return res.status(403).json({ success: false, message: "Not authorized to review this submission" });
    }

    const result = await pool.request()
      .input("ReportId", sql.Int, id)
      .input("Status", sql.NVarChar, Status)
      .input("LecturerComment", sql.NVarChar, LecturerComment || null)
      .query(`
        UPDATE WeeklyReports
        SET Status = @Status, LecturerComment = @LecturerComment
        OUTPUT INSERTED.*
        WHERE ReportId = @ReportId
      `);

    res.status(200).json({ success: true, data: result.recordset[0] });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getPeriods,
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getSubmissions,
  reviewSubmission
};
