const express = require("express");
const router  = express.Router();

const {
  getAllLecturers,
  getLecturerById,
  createLecturer,
  updateLecturer,
  deleteLecturer,
  exportLecturersExcel,
} = require("../controllers/lecturer.controller");

const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

// All lecturer routes require authentication + ADMIN role
router.use(authMiddleware, roleMiddleware("ADMIN"));

// GET /api/lecturers/export
router.get("/export", exportLecturersExcel);

// GET /api/lecturers?page=1&limit=10&search=...
router.get("/", getAllLecturers);

// GET /api/lecturers/:id
router.get("/:id", getLecturerById);

// POST /api/lecturers
router.post("/", createLecturer);

// PUT /api/lecturers/:id
router.put("/:id", updateLecturer);

// DELETE /api/lecturers/:id
router.delete("/:id", deleteLecturer);

module.exports = router;
