const express = require("express");
const router = express.Router();

const {
  getLecturerDashboard,
  getLecturerStudents,
  getLecturerStudentDetail,
  getLecturerFilterOptions,
} = require("../controllers/lecturerDashboard.controller");

const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

// All routes: auth + LECTURER role
router.use(authMiddleware, roleMiddleware("LECTURER"));

// GET /api/lecturer/dashboard
router.get("/dashboard", getLecturerDashboard);

// GET /api/lecturer/students
router.get("/students", getLecturerStudents);

// GET /api/lecturer/students/:id
router.get("/students/:id", getLecturerStudentDetail);

// GET /api/lecturer/filter-options
router.get("/filter-options", getLecturerFilterOptions);

module.exports = router;
