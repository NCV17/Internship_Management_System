const express = require("express");
const router = express.Router();
const {
  getOpenPeriod,
  getCompanies,
  getMyRegistration,
  registerInternship,
} = require("../controllers/studentInternship.controller");

const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

// All routes require auth + STUDENT role
router.use(authMiddleware, roleMiddleware("STUDENT"));

router.get("/open-period", getOpenPeriod);
router.get("/companies", getCompanies);
router.get("/my-registration", getMyRegistration);
router.post("/register-internship", registerInternship);

module.exports = router;
