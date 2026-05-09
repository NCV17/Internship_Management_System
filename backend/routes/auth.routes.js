const express = require("express");
const router = express.Router();
const { login, register, getMe } = require("../controllers/auth.controller");
const authMiddleware = require("../middleware/auth.middleware");

// POST /api/auth/login
router.post("/login", login);

// POST /api/auth/register (Students only)
router.post("/register", register);

// GET /api/auth/me (requires valid token)
router.get("/me", authMiddleware, getMe);

module.exports = router;
