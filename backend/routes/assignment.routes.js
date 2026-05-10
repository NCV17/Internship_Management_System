const express = require("express");
const router = express.Router();
const {
  getAllAssignments,
  getAssignmentById,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  getWorkloadStatistics,
  exportAssignmentsExcel,
  getEligibleStudents
} = require("../controllers/assignment.controller");

const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

// All routes require auth + ADMIN role
router.use(authMiddleware, roleMiddleware("ADMIN"));

router.get("/export/excel", exportAssignmentsExcel);
router.get("/statistics/workload", getWorkloadStatistics);
router.get("/eligible-students", getEligibleStudents);
router.get("/", getAllAssignments);
router.post("/", createAssignment);
router.get("/:id", getAssignmentById);
router.put("/:id", updateAssignment);
router.delete("/:id", deleteAssignment);

module.exports = router;
