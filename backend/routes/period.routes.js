const express = require("express");
const router = express.Router();
const {
  getAllPeriods,
  getPeriodById,
  createPeriod,
  updatePeriod,
  deletePeriod,
  getPeriodStatistics
} = require("../controllers/period.controller");

const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

// All period-management routes require authentication + ADMIN role
router.use(authMiddleware, roleMiddleware("ADMIN"));

router.get("/", getAllPeriods);
router.post("/", createPeriod);
router.get("/:id", getPeriodById);
router.put("/:id", updatePeriod);
router.delete("/:id", deletePeriod);
router.get("/:id/statistics", getPeriodStatistics);

module.exports = router;
