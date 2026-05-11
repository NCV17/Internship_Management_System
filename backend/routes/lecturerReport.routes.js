const express = require("express");
const router = express.Router();

const {
  getPeriods,
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getSubmissions,
  reviewSubmission
} = require("../controllers/lecturerReport.controller");

const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

// All routes: auth + LECTURER role
router.use(authMiddleware, roleMiddleware("LECTURER"));

router.get("/periods", getPeriods);
router.get("/templates", getTemplates);
router.post("/templates", createTemplate);
router.put("/templates/:id", updateTemplate);
router.delete("/templates/:id", deleteTemplate);
router.get("/submissions", getSubmissions);
router.put("/submissions/:id/review", reviewSubmission);

module.exports = router;
