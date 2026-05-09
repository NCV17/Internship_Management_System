/**
 * db.js - SQL Server connection using Windows Authentication
 * Driver: msnodesqlv8 (required for Windows Auth on Windows OS)
 * Connection method: ODBC Connection String (most reliable for named instances)
 */
const sql = require("mssql/msnodesqlv8");
require("dotenv").config({ override: true });

const server   = process.env.DB_SERVER   || "NCV17\\SQLEXPRESS";
const database = process.env.DB_DATABASE || "InternshipManagement";

/**
 * Build ODBC connection string for Windows Authentication.
 * This bypasses TCP/IP issues with named SQL Express instances.
 * ODBC Driver options in priority order:
 *   1. ODBC Driver 17 for SQL Server  (modern)
 *   2. ODBC Driver 13 for SQL Server
 *   3. SQL Server Native Client 11.0  (older, usually pre-installed)
 *   4. SQL Server                     (legacy driver, always available on Windows)
 */
const buildConnectionString = () => {
  const drivers = [
    "ODBC Driver 17 for SQL Server",
    "ODBC Driver 13 for SQL Server",
    "SQL Server Native Client 11.0",
    "SQL Server",
  ];

  // We default to the first available; mssql will try them
  // Use the env override or fall back to SQL Server Native Client 11.0
  const driver = process.env.DB_DRIVER || "ODBC Driver 17 for SQL Server";

  const connStr = 
    `Driver={${driver}};` +
    `Server=${server};` +
    `Database=${database};` +
    `Trusted_Connection=yes;` +
    `TrustServerCertificate=yes;`;
    
  console.log("🔧 Attempting connection with string:", connStr);
  return connStr;
};

const dbConfig = {
  connectionString: buildConnectionString(),
  driver: "msnodesqlv8",
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
  connectionTimeout: 30000,
  requestTimeout: 30000,
};

let pool = null;

const getPool = async () => {
  if (pool && pool.connected) {
    return pool;
  }
  try {
    pool = await sql.connect(dbConfig);
    console.log(`✅ Connected to SQL Server: ${server} | DB: ${database} (Windows Auth)`);
    return pool;
  } catch (err) {
    pool = null;
    console.error("❌ SQL Server connection error:", err.message);
    throw err;
  }
};

module.exports = { getPool, sql };
