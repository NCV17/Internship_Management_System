const { getPool, sql } = require("../config/db");
const { hashPassword } = require("../utils/hash");
const ExcelJS = require("exceljs");

// ─── SHARED: base SELECT with all JOINs ──────────────────────────────────────
const BASE_SELECT = `
  SELECT
    s.StudentId,
    s.StudentCode,
    s.FullName,
    s.ClassName,
    s.Email,
    s.Phone,
    s.CreatedAt,
    s.GPA,
    -- Compute InternshipStatus dynamically from related tables:
    --   COMPLETED  : student has been evaluated (Evaluations table has a record)
    --   IN_PROGRESS: has a company registration + has a lecturer assigned
    --   NOT_STARTED: anything else
    CASE
      WHEN ev.EvaluationId IS NOT NULL                              THEN 'COMPLETED'
      WHEN ir.RegistrationId IS NOT NULL AND a.AssignmentId IS NOT NULL THEN 'IN_PROGRESS'
      ELSE 'NOT_STARTED'
    END                  AS InternshipStatus,
    u.UserId,
    u.Username,
    u.IsActive,
    -- Assigned lecturer (via Assignments table)
    a.AssignmentId,
    a.AssignedDate,
    l.LecturerId,
    l.FullName       AS LecturerName,
    l.LecturerCode,
    l.Department     AS LecturerDepartment,
    -- Internship Period
    p.PeriodId,
    p.PeriodName,
    p.Semester,
    p.AcademicYear,
    -- Internship company (via InternshipRegistrations and Companies)
    ir.RegistrationId,
    c.CompanyName,
    ir.Status        AS RegistrationStatus,
    -- Internship progress
    ip.ProgressId,
    ip.ProgressPercent,
    -- Reports progress
    (SELECT COUNT(*) FROM WeeklyReports wr WHERE wr.StudentId = s.StudentId) + 
    (SELECT COUNT(*) FROM FinalReports fr WHERE fr.StudentId = s.StudentId) AS TotalReportsSubmitted,
    (SELECT COUNT(*) FROM WeeklyReports wr WHERE wr.StudentId = s.StudentId AND wr.Status = 'APPROVED') + 
    (SELECT COUNT(*) FROM FinalReports fr WHERE fr.StudentId = s.StudentId AND fr.Status = 'APPROVED') AS ApprovedReports,
    (SELECT COUNT(*) FROM WeeklyReports wr WHERE wr.StudentId = s.StudentId AND wr.Status = 'PENDING') + 
    (SELECT COUNT(*) FROM FinalReports fr WHERE fr.StudentId = s.StudentId AND fr.Status = 'PENDING') AS PendingReports,
    (SELECT COUNT(*) FROM WeeklyReports wr WHERE wr.StudentId = s.StudentId AND wr.Status = 'REVISION_REQUIRED') + 
    (SELECT COUNT(*) FROM FinalReports fr WHERE fr.StudentId = s.StudentId AND fr.Status = 'REVISION_REQUIRED') AS RevisionReports,
    -- Evaluation scores
    ev.ProcessScore,
    ev.WeeklyReportScore,
    ev.FinalReportScore,
    ev.AttitudeScore,
    ev.TotalScore
  FROM Students s
  INNER JOIN Users u ON s.UserId = u.UserId
  LEFT JOIN Assignments a ON s.StudentId = a.StudentId
  LEFT JOIN Lecturers l ON a.LecturerId = l.LecturerId
  LEFT JOIN InternshipRegistrations ir ON s.StudentId = ir.StudentId
  LEFT JOIN Companies c ON ir.CompanyId = c.CompanyId
  LEFT JOIN InternshipProgress ip ON s.StudentId = ip.StudentId
  LEFT JOIN InternshipPeriods p ON a.PeriodId = p.PeriodId OR ir.PeriodId = p.PeriodId
  LEFT JOIN Evaluations ev ON s.StudentId = ev.StudentId
`;

// ─── HELPER: build filters from query params ──────────────────────────────────
const buildFilters = (query) => {
  const conditions = [];
  const params = {};

  const search = (query.search || "").trim();
  if (search) {
    conditions.push(`(
      s.StudentCode LIKE @Search
      OR s.FullName  LIKE @Search
      OR s.ClassName LIKE @Search
    )`);
    params.Search = `%${search}%`;
  }

  // Filter by internship status (computed dynamically via CASE)
  if (query.status) {
    const statusVal = query.status;
    if (statusVal === 'COMPLETED') {
      conditions.push(`ev.EvaluationId IS NOT NULL`);
    } else if (statusVal === 'IN_PROGRESS') {
      conditions.push(`ir.RegistrationId IS NOT NULL AND a.AssignmentId IS NOT NULL AND ev.EvaluationId IS NULL`);
    } else if (statusVal === 'NOT_STARTED') {
      conditions.push(`(ir.RegistrationId IS NULL OR a.AssignmentId IS NULL) AND ev.EvaluationId IS NULL`);
    }
  }

  // Filter has assigned lecturer: 'yes' | 'no'
  if (query.hasLecturer === "yes") {
    conditions.push(`a.AssignmentId IS NOT NULL`);
  } else if (query.hasLecturer === "no") {
    conditions.push(`a.AssignmentId IS NULL`);
  }

  // Filter has internship company: 'yes' | 'no'
  if (query.hasCompany === "yes") {
    conditions.push(`ir.RegistrationId IS NOT NULL`);
  } else if (query.hasCompany === "no") {
    conditions.push(`ir.RegistrationId IS NULL`);
  }

  // New filters: periodId, lecturerId, companyId
  if (query.periodId) {
    conditions.push(`(a.PeriodId = @PeriodId OR ir.PeriodId = @PeriodId)`);
    params.PeriodId = parseInt(query.periodId);
  }
  if (query.lecturerId) {
    conditions.push(`a.LecturerId = @LecturerId`);
    params.LecturerId = parseInt(query.lecturerId);
  }
  if (query.companyId) {
    conditions.push(`ir.CompanyId = @CompanyId`);
    params.CompanyId = parseInt(query.companyId);
  }

  const whereClause = conditions.length > 0
    ? "WHERE " + conditions.join(" AND ")
    : "";

  return { whereClause, params };
};

// ─── GET ALL STUDENTS ─────────────────────────────────────────────────────────
const getAllStudents = async (req, res, next) => {
  try {
    const pool  = await getPool();
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 10);
    const offset = (page - 1) * limit;

    const { whereClause, params } = buildFilters(req.query);

    // Count query
    let countReq = pool.request();
    for (const key in params) {
      countReq = countReq.input(key, typeof params[key] === 'number' ? sql.Int : sql.NVarChar, params[key]);
    }

    const countResult = await countReq.query(`
      SELECT COUNT(*) AS total
      FROM Students s
      INNER JOIN Users u ON s.UserId = u.UserId
      LEFT JOIN Assignments a ON s.StudentId = a.StudentId
      LEFT JOIN InternshipRegistrations ir ON s.StudentId = ir.StudentId
      LEFT JOIN Companies c ON ir.CompanyId = c.CompanyId
      LEFT JOIN InternshipProgress ip ON s.StudentId = ip.StudentId
      LEFT JOIN Evaluations ev ON s.StudentId = ev.StudentId
      ${whereClause}
    `);

    const total = countResult.recordset[0].total;

    // Data query
    let dataReq = pool.request();
    for (const key in params) {
      dataReq = dataReq.input(key, typeof params[key] === 'number' ? sql.Int : sql.NVarChar, params[key]);
    }
    dataReq = dataReq
      .input("Offset", sql.Int, offset)
      .input("Limit",  sql.Int, limit);

    const dataResult = await dataReq.query(`
      ${BASE_SELECT}
      ${whereClause}
      ORDER BY s.CreatedAt DESC
      OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY
    `);

    return res.status(200).json({
      success: true,
      data: {
        students: dataResult.recordset,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET STUDENT BY ID ────────────────────────────────────────────────────────
const getStudentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const pool   = await getPool();

    const result = await pool
      .request()
      .input("StudentId", sql.Int, parseInt(id))
      .query(`
        ${BASE_SELECT}
        WHERE s.StudentId = @StudentId
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy sinh viên.",
      });
    }

    return res.status(200).json({
      success: true,
      data: result.recordset[0],
    });
  } catch (err) {
    next(err);
  }
};

// ─── UPDATE STUDENT (ADMIN CAN ONLY EDIT: ClassName, GPA, IsActive, and Internship Info) ───
const updateStudent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const studentId = parseInt(id);
    const { className, gpa, isActive, periodId, companyId, lecturerId, status } = req.body;

    const pool = await getPool();

    // Verify student exists
    const existing = await pool
      .request()
      .input("StudentId", sql.Int, studentId)
      .query(`
        SELECT s.StudentId, s.UserId
        FROM Students s
        WHERE s.StudentId = @StudentId
      `);

    if (existing.recordset.length === 0) {
      return res.status(404).json({ success: false, message: "Không tìm thấy sinh viên." });
    }

    const { UserId } = existing.recordset[0];

    // Begin transaction for safe multi-table update
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      const request = new sql.Request(transaction);

      // 1. Update Students table (ClassName, GPA, Status)
      if (className !== undefined || gpa !== undefined || status !== undefined) {
        let updateFields = [];
        if (className !== undefined) { updateFields.push("ClassName = @ClassName"); request.input("ClassName", sql.NVarChar, className.trim()); }
        if (gpa !== undefined) { updateFields.push("GPA = @GPA"); request.input("GPA", sql.Float, parseFloat(gpa)); }
        if (status !== undefined) { updateFields.push("Status = @Status"); request.input("Status", sql.NVarChar, status); }
        
        request.input("StudentId", sql.Int, studentId);
        await request.query(`UPDATE Students SET ${updateFields.join(", ")} WHERE StudentId = @StudentId`);
      }

      // 2. Update Users table (IsActive)
      if (isActive !== undefined) {
        request.input("UserId", sql.Int, UserId);
        request.input("IsActive", sql.Bit, isActive ? 1 : 0);
        await request.query(`UPDATE Users SET IsActive = @IsActive WHERE UserId = @UserId`);
      }

      // Business Rules Check
      if (periodId) {
        const periodCheck = await request.query(`SELECT Status FROM InternshipPeriods WHERE PeriodId = ${parseInt(periodId)}`);
        if (periodCheck.recordset.length > 0 && periodCheck.recordset[0].Status === 'CLOSED') {
          throw new Error("Không thể phân công trong đợt thực tập đã ĐÓNG.");
        }
      }

      if (lecturerId) {
        const lecturerCheck = await request.query(`SELECT u.IsActive FROM Lecturers l JOIN Users u ON l.UserId = u.UserId WHERE l.LecturerId = ${parseInt(lecturerId)}`);
        if (lecturerCheck.recordset.length > 0 && !lecturerCheck.recordset[0].IsActive) {
          throw new Error("Không thể phân công cho giảng viên đang bị khóa tài khoản.");
        }
      }

      // 3. Update or Create InternshipRegistration
      if (companyId && periodId) {
        const regCheck = await request.query(`SELECT RegistrationId FROM InternshipRegistrations WHERE StudentId = ${studentId}`);
        if (regCheck.recordset.length > 0) {
          await request.query(`UPDATE InternshipRegistrations SET CompanyId = ${parseInt(companyId)}, PeriodId = ${parseInt(periodId)} WHERE StudentId = ${studentId}`);
        } else {
          await request.query(`INSERT INTO InternshipRegistrations (StudentId, CompanyId, PeriodId, Status) VALUES (${studentId}, ${parseInt(companyId)}, ${parseInt(periodId)}, 'APPROVED')`);
        }
      }

      // 4. Update or Create Assignment
      if (lecturerId && periodId) {
        // RULE 2: Student MUST already register internship company before assignment.
        // We just created/updated it above if companyId was passed. If not, check if it exists.
        const regCheck2 = await request.query(`SELECT RegistrationId FROM InternshipRegistrations WHERE StudentId = ${studentId} AND PeriodId = ${parseInt(periodId)}`);
        if (regCheck2.recordset.length === 0) {
          throw new Error("Sinh viên phải có Công ty thực tập trước khi được phân công Giảng viên.");
        }

        const assignCheck = await request.query(`SELECT AssignmentId FROM Assignments WHERE StudentId = ${studentId}`);
        if (assignCheck.recordset.length > 0) {
          await request.query(`UPDATE Assignments SET LecturerId = ${parseInt(lecturerId)}, PeriodId = ${parseInt(periodId)} WHERE StudentId = ${studentId}`);
        } else {
          await request.query(`INSERT INTO Assignments (StudentId, LecturerId, PeriodId) VALUES (${studentId}, ${parseInt(lecturerId)}, ${parseInt(periodId)})`);
        }
      }

      // 5. Update or Create InternshipProgress
      const progressCheck = await request.query(`SELECT ProgressId FROM InternshipProgress WHERE StudentId = ${studentId}`);
      const gpaVal = gpa !== undefined ? parseFloat(gpa) : null;
      const statVal = status !== undefined ? `'${status}'` : "'NOT_STARTED'";
      
      if (progressCheck.recordset.length > 0) {
        let progUpdates = [];
        if (gpa !== undefined) progUpdates.push(`GPA = ${gpaVal}`);
        if (status !== undefined) progUpdates.push(`InternshipStatus = ${statVal}`);
        
        if (progUpdates.length > 0) {
          await request.query(`UPDATE InternshipProgress SET ${progUpdates.join(", ")}, UpdatedAt = GETDATE() WHERE StudentId = ${studentId}`);
        }
      } else {
        await request.query(`INSERT INTO InternshipProgress (StudentId, GPA, InternshipStatus, ProgressPercent) VALUES (${studentId}, ${gpaVal !== null ? gpaVal : 'NULL'}, ${statVal}, 0)`);
      }

      await transaction.commit();

      return res.status(200).json({
        success: true,
        message: "Cập nhật thông tin và tiến độ thực tập thành công.",
      });
    } catch (err) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: err.message || "Cập nhật thất bại" });
    }
  } catch (err) {
    next(err);
  }
};

// ─── PATCH: Update Internship Status ─────────────────────────────────────────
const updateInternshipStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { internshipStatus } = req.body;

    const VALID_STATUSES = ["NOT_STARTED", "IN_PROGRESS", "COMPLETED"];
    if (!internshipStatus || !VALID_STATUSES.includes(internshipStatus)) {
      return res.status(400).json({
        success: false,
        message: "Trạng thái không hợp lệ. Phải là: NOT_STARTED, IN_PROGRESS, hoặc COMPLETED.",
      });
    }

    const pool = await getPool();

    // Verify student exists
    const existing = await pool
      .request()
      .input("StudentId", sql.Int, parseInt(id))
      .query(`SELECT s.StudentId FROM Students s WHERE s.StudentId = @StudentId`);

    if (existing.recordset.length === 0) {
      return res.status(404).json({ success: false, message: "Không tìm thấy sinh viên." });
    }

    await pool
      .request()
      .input("StudentId",        sql.Int,      parseInt(id))
      .input("Status",           sql.NVarChar, internshipStatus)
      .query(`UPDATE Students SET Status = @Status WHERE StudentId = @StudentId`);

    return res.status(200).json({
      success: true,
      message: "Cập nhật trạng thái thực tập thành công.",
    });
  } catch (err) {
    next(err);
  }
};

// ─── PATCH: Toggle Account Status (activate/deactivate) ──────────────────────
const updateAccountStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (isActive === undefined) {
      return res.status(400).json({ success: false, message: "isActive là bắt buộc." });
    }

    const pool = await getPool();

    const existing = await pool
      .request()
      .input("StudentId", sql.Int, parseInt(id))
      .query(`SELECT s.StudentId, s.UserId FROM Students s WHERE s.StudentId = @StudentId`);

    if (existing.recordset.length === 0) {
      return res.status(404).json({ success: false, message: "Không tìm thấy sinh viên." });
    }

    const { UserId } = existing.recordset[0];

    await pool
      .request()
      .input("UserId",   sql.Int, UserId)
      .input("IsActive", sql.Bit, isActive ? 1 : 0)
      .query(`UPDATE Users SET IsActive = @IsActive WHERE UserId = @UserId`);

    return res.status(200).json({
      success: true,
      message: isActive ? "Tài khoản đã được kích hoạt." : "Tài khoản đã bị vô hiệu hóa.",
    });
  } catch (err) {
    next(err);
  }
};

// ─── SOFT DELETE: deactivate student account ─────────────────────────────────
const deleteStudent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const pool   = await getPool();

    const existing = await pool
      .request()
      .input("StudentId", sql.Int, parseInt(id))
      .query(`SELECT s.StudentId, s.UserId, s.FullName FROM Students s WHERE s.StudentId = @StudentId`);

    if (existing.recordset.length === 0) {
      return res.status(404).json({ success: false, message: "Không tìm thấy sinh viên." });
    }

    const { UserId, FullName } = existing.recordset[0];

    // Soft delete: deactivate account instead of hard delete
    await pool
      .request()
      .input("UserId", sql.Int, UserId)
      .query(`UPDATE Users SET IsActive = 0 WHERE UserId = @UserId`);

    return res.status(200).json({
      success: true,
      message: `Tài khoản sinh viên "${FullName}" đã bị vô hiệu hóa.`,
    });
  } catch (err) {
    next(err);
  }
};

// ─── CREATE STUDENT ───────────────────────────────────────────────────────────
const createStudent = async (req, res, next) => {
  try {
    const { studentCode, fullName, className, email, phone, password } = req.body;

    if (!studentCode || !fullName || !password) {
      return res.status(400).json({
        success: false,
        message: "MSSV, Họ tên và Mật khẩu là bắt buộc.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Mật khẩu phải có ít nhất 6 ký tự.",
      });
    }

    const pool = await getPool();

    // Check duplicate StudentCode
    const codeCheck = await pool
      .request()
      .input("StudentCode", sql.NVarChar, studentCode.trim())
      .query(`SELECT StudentId FROM Students WHERE StudentCode = @StudentCode`);

    if (codeCheck.recordset.length > 0) {
      return res.status(409).json({
        success: false,
        message: `MSSV "${studentCode}" đã tồn tại.`,
      });
    }

    // Check duplicate Username (Username = StudentCode)
    const usernameCheck = await pool
      .request()
      .input("Username", sql.NVarChar, studentCode.trim())
      .query(`SELECT UserId FROM Users WHERE Username = @Username`);

    if (usernameCheck.recordset.length > 0) {
      return res.status(409).json({
        success: false,
        message: `Tài khoản "${studentCode}" đã tồn tại.`,
      });
    }

    const passwordHash = await hashPassword(password);

    // Insert into Users table
    const userInsert = await pool
      .request()
      .input("Username",     sql.NVarChar, studentCode.trim())
      .input("PasswordHash", sql.NVarChar, passwordHash)
      .input("Role",         sql.NVarChar, "STUDENT")
      .input("IsActive",     sql.Bit,      1)
      .query(`
        INSERT INTO Users (Username, PasswordHash, Role, IsActive)
        OUTPUT INSERTED.UserId
        VALUES (@Username, @PasswordHash, @Role, @IsActive)
      `);

    const newUserId = userInsert.recordset[0].UserId;

    // Insert into Students table
    await pool
      .request()
      .input("UserId",      sql.Int,      newUserId)
      .input("StudentCode", sql.NVarChar, studentCode.trim())
      .input("FullName",    sql.NVarChar, fullName.trim())
      .input("ClassName",   sql.NVarChar, className ? className.trim() : null)
      .input("Email",       sql.NVarChar, email ? email.trim() : null)
      .input("Phone",       sql.NVarChar, phone ? phone.trim() : null)
      .query(`
        INSERT INTO Students (UserId, StudentCode, FullName, ClassName, Email, Phone)
        VALUES (@UserId, @StudentCode, @FullName, @ClassName, @Email, @Phone)
      `);

    return res.status(201).json({
      success: true,
      message: "Thêm sinh viên thành công.",
    });
  } catch (err) {
    if (err.number === 2627 || err.number === 2601) {
      return res.status(409).json({
        success: false,
        message: "Dữ liệu bị trùng lặp (MSSV hoặc Username).",
      });
    }
    next(err);
  }
};

// ─── EXPORT STUDENTS TO EXCEL ─────────────────────────────────────────────────
const exportStudentsExcel = async (req, res, next) => {
  try {
    const pool = await getPool();
    const { whereClause, params } = buildFilters(req.query);

    let dataReq = pool.request();
    if (params.Search)       dataReq = dataReq.input("Search",       sql.NVarChar, params.Search);
    if (params.StatusFilter) dataReq = dataReq.input("StatusFilter", sql.NVarChar, params.StatusFilter);

    const dataResult = await dataReq.query(`
      ${BASE_SELECT}
      ${whereClause}
      ORDER BY s.CreatedAt DESC
    `);

    const students = dataResult.recordset;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Danh sách Sinh viên");

    worksheet.columns = [
      { header: "STT", key: "stt", width: 5 },
      { header: "MSSV", key: "StudentCode", width: 15 },
      { header: "Họ và tên", key: "FullName", width: 25 },
      { header: "Lớp", key: "ClassName", width: 15 },
      { header: "Giảng viên hướng dẫn", key: "LecturerName", width: 25 },
      { header: "Công ty thực tập", key: "CompanyName", width: 30 },
      { header: "GPA", key: "GPA", width: 10 },
      { header: "Trạng thái TT", key: "InternshipStatus", width: 20 },
      { header: "Trạng thái TK", key: "AccountStatus", width: 15 },
    ];

    const statusMap = {
      NOT_STARTED: "Chưa bắt đầu",
      IN_PROGRESS: "Đang thực tập",
      COMPLETED: "Hoàn thành",
    };

    students.forEach((s, index) => {
      worksheet.addRow({
        stt: index + 1,
        StudentCode: s.StudentCode,
        FullName: s.FullName,
        ClassName: s.ClassName || "",
        LecturerName: s.LecturerName || "Chưa phân công",
        CompanyName: s.CompanyName || "Chưa có",
        GPA: s.GPA !== null && s.GPA !== undefined ? s.GPA : "",
        InternshipStatus: statusMap[s.InternshipStatus] || "Chưa bắt đầu",
        AccountStatus: s.IsActive ? "Hoạt động" : "Vô hiệu hóa",
      });
    });

    worksheet.getRow(1).font = { bold: true };

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=" + "Danh_sach_Sinh_vien.xlsx"
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllStudents,
  getStudentById,
  updateStudent,
  updateInternshipStatus,
  updateAccountStatus,
  deleteStudent,
  createStudent,
  exportStudentsExcel,
};
