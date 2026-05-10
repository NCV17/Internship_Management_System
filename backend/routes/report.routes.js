const express = require("express");
const router = express.Router();
const {
  getReports,
  reviewReport,
  exportReportsExcel
} = require("../controllers/report.controller");

const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

router.use(authMiddleware, roleMiddleware("ADMIN"));

router.get("/", getReports);
router.get("/export/excel", exportReportsExcel);
router.put("/:type/:id/review", reviewReport);

module.exports = router;
