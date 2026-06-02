const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const c = require("../controllers/notificationController");

router.get("/", auth, c.listMine);
router.get("/unread-count", auth, c.unreadCount);
router.post("/:id/read", auth, c.markRead);
router.post("/mark-all-read", auth, c.markAllRead);

module.exports = router;
