const express = require("express");
const router = express.Router();

const { updateProfile, changePassword } = require("../controllers/studentProfile.controller");
const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

// Require STUDENT role
router.use(authMiddleware, roleMiddleware("STUDENT"));

router.put("/", updateProfile);
router.put("/change-password", changePassword);

module.exports = router;
