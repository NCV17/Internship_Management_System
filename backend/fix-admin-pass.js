require("dotenv").config();
const { getPool, sql } = require("./config/db");
const { hashPassword } = require("./utils/hash");

async function fixAdminPassword() {
  try {
    const pool = await getPool();
    console.log("Connected to DB.");

    const newPassword = "123456";
    const hashed = await hashPassword(newPassword);

    await pool.request()
      .input("Username", sql.NVarChar, "admin")
      .input("PasswordHash", sql.NVarChar, hashed)
      .query(`
        UPDATE Users 
        SET PasswordHash = @PasswordHash 
        WHERE Username = @Username
      `);

    console.log("✅ Admin password successfully updated to bcrypt hash of 'Admin@123'!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error updating password:", err.message);
    process.exit(1);
  }
}

fixAdminPassword();
