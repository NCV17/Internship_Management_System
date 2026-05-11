const { getPool, sql } = require("../config/db");
const { hashPassword, comparePassword } = require("../utils/hash");

const getStudentIdByUserId = async (pool, userId) => {
  const res = await pool
    .request()
    .input("UserId", sql.Int, userId)
    .query(`SELECT StudentId FROM Students WHERE UserId = @UserId`);
  return res.recordset[0]?.StudentId || null;
};

// PUT /api/student/profile
const updateProfile = async (req, res, next) => {
  try {
    const pool = await getPool();
    const userId = req.user.userId;
    const { email, phone } = req.body;

    const studentId = await getStudentIdByUserId(pool, userId);
    if (!studentId) {
      return res.status(404).json({ success: false, message: "Student profile not found." });
    }

    await pool
      .request()
      .input("StudentId", sql.Int, studentId)
      .input("Email", sql.NVarChar, email)
      .input("Phone", sql.NVarChar, phone)
      .query(`
        UPDATE Students 
        SET Email = @Email, Phone = @Phone 
        WHERE StudentId = @StudentId
      `);

    return res.status(200).json({ success: true, message: "Cập nhật thông tin thành công." });
  } catch (err) {
    next(err);
  }
};

// PUT /api/student/profile/change-password
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const pool = await getPool();
    const userId = req.user.userId;

    const userResult = await pool
      .request()
      .input("UserId", sql.Int, userId)
      .query(`SELECT PasswordHash FROM Users WHERE UserId = @UserId`);

    if (userResult.recordset.length === 0) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const { PasswordHash } = userResult.recordset[0];

    const isMatch = await comparePassword(currentPassword, PasswordHash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Mật khẩu hiện tại không chính xác." });
    }

    const newHash = await hashPassword(newPassword);

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
  updateProfile,
  changePassword,
};
