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

module.exports = {
  getOpenPeriod,
  getCompanies,
  getMyRegistration,
  registerInternship,
};
