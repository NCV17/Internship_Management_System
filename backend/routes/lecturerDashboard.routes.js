const express = require("express");
const router = express.Router();

const {
  getLecturerDashboard,
  getLecturerStudents,
  getLecturerStudentDetail,
  getLecturerFilterOptions,
  reviewWeeklyReport,
  evaluateStudent,
  getEvaluationStudents,
} = require("../controllers/lecturerDashboard.controller");

const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

router.use(authMiddleware, roleMiddleware("LECTURER"));

router.get("/dashboard", getLecturerDashboard);
router.get("/students", getLecturerStudents);
router.get("/students/:id", getLecturerStudentDetail);
router.get("/filter-options", getLecturerFilterOptions);
router.put("/students/:studentId/reports/weekly/:reportId/review", reviewWeeklyReport);
router.post("/students/:studentId/evaluate", evaluateStudent);
router.get("/evaluations", getEvaluationStudents);

module.exports = router;
