/**
 * test-db.js - Quick SQL Server connection diagnostic
 * Run: node test-db.js
 */
require("dotenv").config();
const sql = require("mssql/msnodesqlv8");

const server   = process.env.DB_SERVER   || "NCV17\\SQLEXPRESS";
const database = process.env.DB_DATABASE || "InternshipManagement";

// Try multiple ODBC drivers in order
const driversToTry = [
  "ODBC Driver 17 for SQL Server",
  "ODBC Driver 13 for SQL Server",
  "SQL Server Native Client 11.0",
  "SQL Server",
];

const testDriver = async (driver) => {
  const connStr =
    `Driver={${driver}};` +
    `Server=${server};` +
    `Database=${database};` +
    `Trusted_Connection=yes;` +
    `TrustServerCertificate=yes;`;

  console.log(`\n🔍 Trying driver: "${driver}"`);

  try {
    const pool = await sql.connect({
      connectionString: connStr,
      driver: "msnodesqlv8",
      connectionTimeout: 8000,
      requestTimeout: 8000,
    });

    const result = await pool.request().query("SELECT @@VERSION AS Version, DB_NAME() AS CurrentDB");
    const row = result.recordset[0];
    console.log(`✅ SUCCESS with driver: "${driver}"`);
    console.log(`   Current DB : ${row.CurrentDB}`);
    console.log(`   SQL Version: ${row.Version.split("\n")[0]}`);

    // Check Users table
    const users = await pool.request().query("SELECT COUNT(*) AS cnt FROM Users");
    console.log(`   Users table: ${users.recordset[0].cnt} row(s)`);

    await pool.close();
    return driver; // Return the working driver
  } catch (err) {
    console.log(`   ❌ Failed: ${err.message.split("\n")[0]}`);
    return null;
  }
};

const run = async () => {
  console.log("=".repeat(60));
  console.log("  SQL Server Connection Diagnostic");
  console.log(`  Server  : ${server}`);
  console.log(`  Database: ${database}`);
  console.log(`  Auth    : Windows Authentication`);
  console.log("=".repeat(60));

  for (const driver of driversToTry) {
    const working = await testDriver(driver);
    if (working) {
      console.log("\n" + "=".repeat(60));
      console.log(`\n🎉 Use this driver in your .env:`);
      console.log(`   DB_DRIVER=${working}`);
      console.log("\n✅ Your connection is working! You can now login.\n");
      process.exit(0);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("\n❌ ALL DRIVERS FAILED. Please check:\n");
  console.log("1. Is SQL Server Browser service running?");
  console.log("   → Open: services.msc → Find 'SQL Server Browser' → Start it");
  console.log("2. Is TCP/IP enabled on SQLEXPRESS?");
  console.log("   → Open: SQL Server Configuration Manager");
  console.log("   → SQL Server Network Configuration → Protocols for SQLEXPRESS");
  console.log("   → Enable TCP/IP → Restart SQL Server service");
  console.log("3. Is the instance name correct? SSMS shows: NCV17\\SQLEXPRESS");
  process.exit(1);
};

run();
