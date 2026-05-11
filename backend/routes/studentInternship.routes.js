const express = require("express");
const router = express.Router();
const {
  getOpenPeriod,
  getCompanies,
  getMyRegistration,
  registerInternship,
  getMyInternshipInfo,
  getStudentReports,
  submitReport
} = require("../controllers/studentInternship.controller");

const { getStudentEvaluationResult } = require("../controllers/lecturerDashboard.controller");

const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

router.use(authMiddleware, roleMiddleware("STUDENT"));

router.get("/open-period", getOpenPeriod);
router.get("/companies", getCompanies);
router.get("/my-registration", getMyRegistration);
router.get("/my-internship-info", getMyInternshipInfo);
router.post("/register-internship", registerInternship);

const upload = require("../middleware/upload.middleware");
router.get("/reports", getStudentReports);
router.post("/reports", upload.single("file"), submitReport);
router.get("/evaluation-result", getStudentEvaluationResult);

module.exports = router;
