const express = require("express");
const router = express.Router();
const {
  getOverview,
  getStatusSummary,
  getTopCompanies,
  getLecturerWorkload,
  getCurrentPeriod,
  getRecentActivities
} = require("../controllers/dashboard.controller");

const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

// All routes require auth + ADMIN role
router.use(authMiddleware, roleMiddleware("ADMIN"));

router.get("/overview", getOverview);
router.get("/status-summary", getStatusSummary);
router.get("/top-companies", getTopCompanies);
router.get("/lecturer-workload", getLecturerWorkload);
router.get("/current-period", getCurrentPeriod);
router.get("/recent-activities", getRecentActivities);

module.exports = router;
