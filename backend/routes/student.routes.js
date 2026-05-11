const express = require("express");
const router  = express.Router();

const {
  getAllStudents,
  getStudentById,
  updateStudent,
  updateInternshipStatus,
  updateAccountStatus,
  deleteStudent,
  createStudent,
  exportStudentsExcel,
} = require("../controllers/student.controller");

const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

// All student-management routes require authentication + ADMIN role
router.use(authMiddleware, roleMiddleware("ADMIN"));

// GET /api/students/export (must be before /:id)
router.get("/export", exportStudentsExcel);

// GET /api/students?page=1&limit=10&search=...&status=...&hasLecturer=yes&hasCompany=no
router.get("/", getAllStudents);

// POST /api/students
router.post("/", createStudent);

// GET /api/students/:id
router.get("/:id", getStudentById);

// PUT /api/students/:id  — update ClassName, GPA, IsActive
router.put("/:id", updateStudent);

// PATCH /api/students/:id/status  — update InternshipStatus
router.patch("/:id/status", updateInternshipStatus);

// PATCH /api/students/:id/account-status  — activate/deactivate account
router.patch("/:id/account-status", updateAccountStatus);

// DELETE /api/students/:id  — soft delete (deactivate)
router.delete("/:id", deleteStudent);

module.exports = router;
