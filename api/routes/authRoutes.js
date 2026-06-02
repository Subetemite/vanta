const express = require("express");
const router = express.Router();

const {
  listLoginHistory,
  listUsers,
  login,
  me,
  register,
  updateUserAccess,
  updateProfile,
  changeOwnPassword,
} = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/register", register);
router.post("/login", login);
router.get("/me", authMiddleware, me);
router.put("/me", authMiddleware, updateProfile);
router.post("/me/password", authMiddleware, changeOwnPassword);
router.get("/login-history", authMiddleware, listLoginHistory);
router.get("/users", authMiddleware, listUsers);
router.put("/users/:id", authMiddleware, updateUserAccess);

module.exports = router;
