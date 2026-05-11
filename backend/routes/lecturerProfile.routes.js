const express = require("express");
const router = express.Router();
const lecturerProfileController = require("../controllers/lecturerProfile.controller");
const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

// All routes here require LECTURER role
router.use(authMiddleware);
router.use(roleMiddleware("LECTURER"));

router.get("/", lecturerProfileController.getProfile);
router.put("/", lecturerProfileController.updateProfile);
router.put("/change-password", lecturerProfileController.changePassword);

module.exports = router;
