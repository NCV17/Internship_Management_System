require("dotenv").config({ override: true });
const express = require("express");
const cors = require("cors");

const authRoutes     = require("./routes/auth.routes");
const lecturerRoutes = require("./routes/lecturer.routes");
const studentRoutes  = require("./routes/student.routes");
const periodRoutes   = require("./routes/period.routes");
const companyRoutes  = require("./routes/company.routes");
const assignmentRoutes = require("./routes/assignment.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const reportRoutes   = require("./routes/report.routes");
const studentInternshipRoutes = require("./routes/studentInternship.routes");
const lecturerDashboardRoutes = require("./routes/lecturerDashboard.routes");
const lecturerReportRoutes = require("./routes/lecturerReport.routes");
const errorHandler   = require("./middleware/error.middleware");

const app = express();

// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

// ─── BODY PARSING ─────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── ROUTES ───────────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    message: "Internship Management API is running",
    version: "1.0.0",
  });
});

app.use("/api/auth",      authRoutes);
app.use("/api/lecturers", lecturerRoutes);
app.use("/api/students",  studentRoutes);
app.use("/api/periods",   periodRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/admin/dashboard", dashboardRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/student", studentInternshipRoutes);
app.use("/api/lecturer", lecturerDashboardRoutes);
app.use("/api/lecturer/workflow", lecturerReportRoutes);

// ─── 404 HANDLER ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found.`,
  });
});

// ─── GLOBAL ERROR HANDLER ─────────────────────────────────────────────────────
app.use(errorHandler);

// ─── START SERVER ─────────────────────────────────────────────────────────────
const { getPool } = require("./config/db");

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  try {
    // Kích hoạt kết nối DB ngay khi khởi động server
    await getPool();
  } catch (err) {
    console.error("Lỗi kết nối DB lúc khởi động:", err.message);
  }
});