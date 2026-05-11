const express = require("express");
const router = express.Router();
const {
  getAllCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany,
  getCompanyStatistics,
  exportCompaniesExcel
} = require("../controllers/company.controller");

const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

// All company routes require auth + ADMIN role
router.use(authMiddleware, roleMiddleware("ADMIN"));

router.get("/export/excel", exportCompaniesExcel);
router.get("/", getAllCompanies);
router.post("/", createCompany);
router.get("/:id", getCompanyById);
router.put("/:id", updateCompany);
router.delete("/:id", deleteCompany);
router.get("/:id/statistics", getCompanyStatistics);

module.exports = router;
