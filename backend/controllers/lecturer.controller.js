const { getPool, sql } = require("../config/db");
const { hashPassword } = require("../utils/hash");
const ExcelJS = require("exceljs");

// ─── GET ALL LECTURERS (with search & pagination) ─────────────────────────────
const getAllLecturers = async (req, res, next) => {
  try {
    const pool = await getPool();

    const page     = Math.max(1, parseInt(req.query.page)  || 1);
    const limit    = Math.min(100, parseInt(req.query.limit) || 10);
    const offset   = (page - 1) * limit;
    const search   = (req.query.search || "").trim();

    // Build WHERE clause
    const whereClause = search
      ? `WHERE l.LecturerCode LIKE @Search
          OR l.FullName       LIKE @Search
          OR l.Department     LIKE @Search
          OR l.Email          LIKE @Search`
      : "";

    const searchParam = `%${search}%`;

    // Total count
    const countResult = await pool
      .request()
      .input("Search", sql.NVarChar, searchParam)
      .query(`
        SELECT COUNT(*) AS total
        FROM Lecturers l
        INNER JOIN Users u ON l.UserId = u.UserId
        ${whereClause}
      `);

    const total = countResult.recordset[0].total;

    // Paginated data
    const dataResult = await pool
      .request()
      .input("Search", sql.NVarChar, searchParam)
      .input("Offset", sql.Int, offset)
      .input("Limit",  sql.Int, limit)
      .query(`
        SELECT
          l.LecturerId,
          l.LecturerCode,
          l.FullName,
          l.Department,
          l.Email,
          l.Phone,
          l.CreatedAt,
          u.UserId,
          u.Username,
          u.IsActive
        FROM Lecturers l
        INNER JOIN Users u ON l.UserId = u.UserId
        ${whereClause}
        ORDER BY l.CreatedAt DESC
        OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY
      `);

    return res.status(200).json({
      success: true,
      data: {
        lecturers: dataResult.recordset,
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

// ─── GET LECTURER BY ID ───────────────────────────────────────────────────────
const getLecturerById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const pool   = await getPool();

    const result = await pool
      .request()
      .input("LecturerId", sql.Int, parseInt(id))
      .query(`
        SELECT
          l.LecturerId,
          l.LecturerCode,
          l.FullName,
          l.Department,
          l.Email,
          l.Phone,
          l.CreatedAt,
          u.UserId,
          u.Username,
          u.IsActive
        FROM Lecturers l
        INNER JOIN Users u ON l.UserId = u.UserId
        WHERE l.LecturerId = @LecturerId
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Lecturer not found.",
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

// ─── CREATE LECTURER ──────────────────────────────────────────────────────────
const createLecturer = async (req, res, next) => {
  try {
    const { lecturerCode, fullName, department, email, phone, password } = req.body;

    // Validate required fields
    if (!lecturerCode || !fullName || !password) {
      return res.status(400).json({
        success: false,
        message: "lecturerCode, fullName, and password are required.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters.",
      });
    }

    const pool = await getPool();

    // Check duplicate LecturerCode
    const codeCheck = await pool
      .request()
      .input("LecturerCode", sql.NVarChar, lecturerCode.trim())
      .query(`SELECT LecturerId FROM Lecturers WHERE LecturerCode = @LecturerCode`);

    if (codeCheck.recordset.length > 0) {
      return res.status(409).json({
        success: false,
        message: `Lecturer code "${lecturerCode}" already exists.`,
      });
    }

    // Check duplicate Username (lecturerCode is used as username)
    const usernameCheck = await pool
      .request()
      .input("Username", sql.NVarChar, lecturerCode.trim())
      .query(`SELECT UserId FROM Users WHERE Username = @Username`);

    if (usernameCheck.recordset.length > 0) {
      return res.status(409).json({
        success: false,
        message: `Username "${lecturerCode}" already exists.`,
      });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Insert into Users
    const userInsert = await pool
      .request()
      .input("Username",     sql.NVarChar, lecturerCode.trim())
      .input("PasswordHash", sql.NVarChar, passwordHash)
      .input("Role",         sql.NVarChar, "LECTURER")
      .input("IsActive",     sql.Bit,      1)
      .query(`
        INSERT INTO Users (Username, PasswordHash, Role, IsActive)
        OUTPUT INSERTED.UserId
        VALUES (@Username, @PasswordHash, @Role, @IsActive)
      `);

    const newUserId = userInsert.recordset[0].UserId;

    // Insert into Lecturers
    const lecturerInsert = await pool
      .request()
      .input("UserId",       sql.Int,      newUserId)
      .input("LecturerCode", sql.NVarChar, lecturerCode.trim())
      .input("FullName",     sql.NVarChar, fullName.trim())
      .input("Department",   sql.NVarChar, department ? department.trim() : null)
      .input("Email",        sql.NVarChar, email      ? email.trim()      : null)
      .input("Phone",        sql.NVarChar, phone      ? phone.trim()      : null)
      .query(`
        INSERT INTO Lecturers (UserId, LecturerCode, FullName, Department, Email, Phone)
        OUTPUT INSERTED.LecturerId
        VALUES (@UserId, @LecturerCode, @FullName, @Department, @Email, @Phone)
      `);

    const newLecturerId = lecturerInsert.recordset[0].LecturerId;

    return res.status(201).json({
      success: true,
      message: "Lecturer created successfully.",
      data: {
        lecturerId:   newLecturerId,
        userId:       newUserId,
        lecturerCode: lecturerCode.trim(),
        fullName:     fullName.trim(),
        department:   department || null,
        email:        email      || null,
        phone:        phone      || null,
      },
    });
  } catch (err) {
    // SQL Server unique constraint violation
    if (err.number === 2627 || err.number === 2601) {
      return res.status(409).json({
        success: false,
        message: "Duplicate entry: LecturerCode or Username already exists.",
      });
    }
    next(err);
  }
};

// ─── UPDATE LECTURER ──────────────────────────────────────────────────────────
const updateLecturer = async (req, res, next) => {
  try {
    const { id }                                   = req.params;
    const { fullName, department, email, phone, isActive } = req.body;

    if (!fullName) {
      return res.status(400).json({
        success: false,
        message: "fullName is required.",
      });
    }

    const pool = await getPool();

    // Verify lecturer exists
    const existing = await pool
      .request()
      .input("LecturerId", sql.Int, parseInt(id))
      .query(`
        SELECT l.LecturerId, l.UserId
        FROM Lecturers l
        WHERE l.LecturerId = @LecturerId
      `);

    if (existing.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Lecturer not found.",
      });
    }

    const { UserId } = existing.recordset[0];

    // Update Lecturers table
    await pool
      .request()
      .input("LecturerId", sql.Int,      parseInt(id))
      .input("FullName",   sql.NVarChar, fullName.trim())
      .input("Department", sql.NVarChar, department ? department.trim() : null)
      .input("Email",      sql.NVarChar, email      ? email.trim()      : null)
      .input("Phone",      sql.NVarChar, phone      ? phone.trim()      : null)
      .query(`
        UPDATE Lecturers
        SET FullName   = @FullName,
            Department = @Department,
            Email      = @Email,
            Phone      = @Phone
        WHERE LecturerId = @LecturerId
      `);

    // Update IsActive in Users table if provided
    if (isActive !== undefined) {
      await pool
        .request()
        .input("UserId",   sql.Int, UserId)
        .input("IsActive", sql.Bit, isActive ? 1 : 0)
        .query(`UPDATE Users SET IsActive = @IsActive WHERE UserId = @UserId`);
    }

    return res.status(200).json({
      success: true,
      message: "Lecturer updated successfully.",
    });
  } catch (err) {
    next(err);
  }
};

// ─── DELETE LECTURER ──────────────────────────────────────────────────────────
const deleteLecturer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const pool   = await getPool();

    // Verify lecturer exists and get UserId
    const existing = await pool
      .request()
      .input("LecturerId", sql.Int, parseInt(id))
      .query(`SELECT LecturerId, UserId FROM Lecturers WHERE LecturerId = @LecturerId`);

    if (existing.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Lecturer not found.",
      });
    }

    const { UserId } = existing.recordset[0];

    // Delete Lecturers row first (FK constraint), then Users row
    await pool
      .request()
      .input("LecturerId", sql.Int, parseInt(id))
      .query(`DELETE FROM Lecturers WHERE LecturerId = @LecturerId`);

    await pool
      .request()
      .input("UserId", sql.Int, UserId)
      .query(`DELETE FROM Users WHERE UserId = @UserId`);

    return res.status(200).json({
      success: true,
      message: "Lecturer deleted successfully.",
    });
  } catch (err) {
    next(err);
  }
};

// ─── EXPORT LECTURERS TO EXCEL ────────────────────────────────────────────────
const exportLecturersExcel = async (req, res, next) => {
  try {
    const pool = await getPool();

    const search = (req.query.search || "").trim();
    const whereClause = search
      ? `WHERE l.LecturerCode LIKE @Search
          OR l.FullName       LIKE @Search
          OR l.Department     LIKE @Search
          OR l.Email          LIKE @Search`
      : "";

    const dataResult = await pool
      .request()
      .input("Search", sql.NVarChar, `%${search}%`)
      .query(`
        SELECT
          l.LecturerId,
          l.LecturerCode,
          l.FullName,
          l.Department,
          l.Email,
          l.Phone,
          u.IsActive,
          (SELECT COUNT(*) FROM Assignments a WHERE a.LecturerId = l.LecturerId) as StudentCount
        FROM Lecturers l
        INNER JOIN Users u ON l.UserId = u.UserId
        ${whereClause}
        ORDER BY l.CreatedAt DESC
      `);

    const lecturers = dataResult.recordset;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Danh sách Giảng viên");

    worksheet.columns = [
      { header: "STT", key: "stt", width: 5 },
      { header: "Mã GV", key: "LecturerCode", width: 15 },
      { header: "Họ và tên", key: "FullName", width: 25 },
      { header: "Khoa/Bộ môn", key: "Department", width: 25 },
      { header: "Email", key: "Email", width: 30 },
      { header: "Số điện thoại", key: "Phone", width: 15 },
      { header: "Sinh viên hướng dẫn", key: "StudentCount", width: 20 },
      { header: "Trạng thái", key: "IsActive", width: 15 },
    ];

    lecturers.forEach((l, index) => {
      worksheet.addRow({
        stt: index + 1,
        LecturerCode: l.LecturerCode,
        FullName: l.FullName,
        Department: l.Department || "",
        Email: l.Email || "",
        Phone: l.Phone || "",
        StudentCount: l.StudentCount,
        IsActive: l.IsActive ? "Hoạt động" : "Vô hiệu hóa",
      });
    });

    worksheet.getRow(1).font = { bold: true };

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=" + "Danh_sach_Giang_vien.xlsx"
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllLecturers,
  getLecturerById,
  createLecturer,
  updateLecturer,
  deleteLecturer,
  exportLecturersExcel,
};
