const { getPool, sql } = require("../config/db");
const { hashPassword, comparePassword } = require("../utils/hash");
const { generateToken } = require("../utils/jwt");

// ─── LOGIN ──────────────────────────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required.",
      });
    }

    const pool = await getPool();

    // Find user by username
    const userResult = await pool
      .request()
      .input("Username", sql.NVarChar, username.trim())
      .query(`
        SELECT UserId, Username, PasswordHash, Role, IsActive
        FROM Users
        WHERE Username = @Username
      `);

    if (userResult.recordset.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password.",
      });
    }

    const user = userResult.recordset[0];

    // Check if account is active
    if (!user.IsActive) {
      return res.status(403).json({
        success: false,
        message: "Account is deactivated. Please contact admin.",
      });
    }

    // Compare password
    const isMatch = await comparePassword(password, user.PasswordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password.",
      });
    }

    // Fetch role-specific profile info
    let profile = {};

    if (user.Role === "STUDENT") {
      const studentResult = await pool
        .request()
        .input("UserId", sql.Int, user.UserId)
        .query(`
          SELECT StudentId, StudentCode, FullName, ClassName, Email, Phone
          FROM Students
          WHERE UserId = @UserId
        `);
      if (studentResult.recordset.length > 0) {
        profile = studentResult.recordset[0];
      }
    } else if (user.Role === "LECTURER") {
      const lecturerResult = await pool
        .request()
        .input("UserId", sql.Int, user.UserId)
        .query(`
          SELECT LecturerId, LecturerCode, FullName, Department, Email, Phone
          FROM Lecturers
          WHERE UserId = @UserId
        `);
      if (lecturerResult.recordset.length > 0) {
        profile = lecturerResult.recordset[0];
      }
    } else if (user.Role === "ADMIN") {
      profile = { fullName: "Administrator" };
    }

    // Generate JWT
    const tokenPayload = {
      userId: user.UserId,
      username: user.Username,
      role: user.Role,
    };
    const token = generateToken(tokenPayload);

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      data: {
        token,
        role: user.Role,
        user: {
          userId: user.UserId,
          username: user.Username,
          role: user.Role,
          ...profile,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── REGISTER (STUDENT ONLY) ─────────────────────────────────────────────────
const register = async (req, res, next) => {
  try {
    const { studentCode, fullName, className, email, phone, password } =
      req.body;

    // Validate required fields
    if (!studentCode || !fullName || !className || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "studentCode, fullName, className, email, and password are required.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters.",
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
        message: "Student code already registered.",
      });
    }

    // Check duplicate Username (studentCode is used as username)
    const usernameCheck = await pool
      .request()
      .input("Username", sql.NVarChar, studentCode.trim())
      .query(`SELECT UserId FROM Users WHERE Username = @Username`);

    if (usernameCheck.recordset.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Username already exists.",
      });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Insert into Users table
    const userInsert = await pool
      .request()
      .input("Username", sql.NVarChar, studentCode.trim())
      .input("PasswordHash", sql.NVarChar, passwordHash)
      .input("Role", sql.NVarChar, "STUDENT")
      .input("IsActive", sql.Bit, 1)
      .query(`
        INSERT INTO Users (Username, PasswordHash, Role, IsActive)
        OUTPUT INSERTED.UserId
        VALUES (@Username, @PasswordHash, @Role, @IsActive)
      `);

    const newUserId = userInsert.recordset[0].UserId;

    // Insert into Students table
    await pool
      .request()
      .input("UserId", sql.Int, newUserId)
      .input("StudentCode", sql.NVarChar, studentCode.trim())
      .input("FullName", sql.NVarChar, fullName.trim())
      .input("ClassName", sql.NVarChar, className.trim())
      .input("Email", sql.NVarChar, email.trim())
      .input("Phone", sql.NVarChar, phone ? phone.trim() : null)
      .query(`
        INSERT INTO Students (UserId, StudentCode, FullName, ClassName, Email, Phone)
        VALUES (@UserId, @StudentCode, @FullName, @ClassName, @Email, @Phone)
      `);

    return res.status(201).json({
      success: true,
      message: "Registration successful. You can now login.",
      data: {
        username: studentCode.trim(),
        role: "STUDENT",
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET CURRENT USER ────────────────────────────────────────────────────────
const getMe = async (req, res, next) => {
  try {
    const { userId, role } = req.user;
    const pool = await getPool();

    // Fetch user base info
    const userResult = await pool
      .request()
      .input("UserId", sql.Int, userId)
      .query(`
        SELECT UserId, Username, Role, IsActive
        FROM Users
        WHERE UserId = @UserId
      `);

    if (userResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const user = userResult.recordset[0];
    let profile = {};

    if (role === "STUDENT") {
      const studentResult = await pool
        .request()
        .input("UserId", sql.Int, userId)
        .query(`
          SELECT StudentId, StudentCode, FullName, ClassName, Email, Phone
          FROM Students
          WHERE UserId = @UserId
        `);
      if (studentResult.recordset.length > 0) {
        profile = studentResult.recordset[0];
      }
    } else if (role === "LECTURER") {
      const lecturerResult = await pool
        .request()
        .input("UserId", sql.Int, userId)
        .query(`
          SELECT LecturerId, LecturerCode, FullName, Department, Email, Phone
          FROM Lecturers
          WHERE UserId = @UserId
        `);
      if (lecturerResult.recordset.length > 0) {
        profile = lecturerResult.recordset[0];
      }
    } else if (role === "ADMIN") {
      profile = { fullName: "Administrator" };
    }

    return res.status(200).json({
      success: true,
      data: {
        userId: user.UserId,
        username: user.Username,
        role: user.Role,
        isActive: user.IsActive,
        ...profile,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { login, register, getMe };
