const { getPool, sql } = require("../config/db");
const { hashPassword, comparePassword } = require("../utils/hash");

// Helper: Get LecturerId from userId
const getLecturerIdByUserId = async (pool, userId) => {
  const result = await pool
    .request()
    .input("UserId", sql.Int, userId)
    .query(`SELECT LecturerId FROM Lecturers WHERE UserId = @UserId`);
  if (result.recordset.length === 0) return null;
  return result.recordset[0].LecturerId;
};

// GET /api/lecturer/profile
const getProfile = async (req, res, next) => {
  try {
    const pool = await getPool();
    const userId = req.user.userId;

    const lecturerId = await getLecturerIdByUserId(pool, userId);
    if (!lecturerId) {
      return res.status(404).json({ success: false, message: "Lecturer profile not found." });
    }

    // 1. Get lecturer info
    const lecturerInfo = await pool
      .request()
      .input("LecturerId", sql.Int, lecturerId)
      .query(`
        SELECT l.LecturerId, l.LecturerCode, l.FullName, l.Department, l.Email, l.Phone, l.CreatedAt, u.IsActive, u.Role
        FROM Lecturers l
        JOIN Users u ON l.UserId = u.UserId
        WHERE l.LecturerId = @LecturerId
      `);

    const lecturer = lecturerInfo.recordset[0];

    // 2. Get Statistics
    // Assigned students count
    const statsStudents = await pool
      .request()
      .input("LecturerId", sql.Int, lecturerId)
      .query(`SELECT COUNT(*) AS count FROM Assignments WHERE LecturerId = @LecturerId`);

    // Approved reports count
    const statsReports = await pool
      .request()
      .input("LecturerId", sql.Int, lecturerId)
      .query(`
        SELECT COUNT(*) AS count 
        FROM WeeklyReports wr 
        INNER JOIN Assignments a ON wr.StudentId = a.StudentId AND wr.PeriodId = a.PeriodId
        WHERE a.LecturerId = @LecturerId AND wr.Status = 'APPROVED'
      `);

    // Completed evaluations count
    const statsEvaluations = await pool
      .request()
      .input("LecturerId", sql.Int, lecturerId)
      .query(`SELECT COUNT(*) AS count FROM Evaluations WHERE LecturerId = @LecturerId`);

    return res.status(200).json({
      success: true,
      data: {
        profile: lecturer,
        stats: {
          assignedStudents: statsStudents.recordset[0].count,
          approvedReports: statsReports.recordset[0].count,
          completedEvaluations: statsEvaluations.recordset[0].count
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

// PUT /api/lecturer/profile
const updateProfile = async (req, res, next) => {
  try {
    const pool = await getPool();
    const userId = req.user.userId;
    const { email, phone } = req.body;

    const lecturerId = await getLecturerIdByUserId(pool, userId);
    if (!lecturerId) {
      return res.status(404).json({ success: false, message: "Lecturer profile not found." });
    }

    await pool
      .request()
      .input("LecturerId", sql.Int, lecturerId)
      .input("Email", sql.NVarChar, email)
      .input("Phone", sql.NVarChar, phone)
      .query(`
        UPDATE Lecturers 
        SET Email = @Email, Phone = @Phone 
        WHERE LecturerId = @LecturerId
      `);

    return res.status(200).json({ success: true, message: "Cập nhật thông tin thành công." });
  } catch (err) {
    next(err);
  }
};

// PUT /api/lecturer/profile/change-password
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const pool = await getPool();
    const userId = req.user.userId;

    // Get current password hash
    const userResult = await pool
      .request()
      .input("UserId", sql.Int, userId)
      .query(`SELECT PasswordHash FROM Users WHERE UserId = @UserId`);

    if (userResult.recordset.length === 0) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const { PasswordHash } = userResult.recordset[0];

    // Verify current password
    const isMatch = await comparePassword(currentPassword, PasswordHash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Mật khẩu hiện tại không chính xác." });
    }

    // Hash new password
    const newHash = await hashPassword(newPassword);

    // Update password
    await pool
      .request()
      .input("UserId", sql.Int, userId)
      .input("NewHash", sql.NVarChar, newHash)
      .query(`UPDATE Users SET PasswordHash = @NewHash WHERE UserId = @UserId`);

    return res.status(200).json({ success: true, message: "Đổi mật khẩu thành công." });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
};
