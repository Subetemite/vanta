const express = require("express");
const router = express.Router();
const auth = require("../../middleware/authMiddleware");
const c = require("../../controllers/admin/calendarController");

router.get("/meta", auth, c.getMeta);
router.get("/feed", auth, c.getFeed);

router.get("/activities", auth, c.listActivities);
router.post("/activities", auth, c.createActivity);
router.put("/activities/:id", auth, c.updateActivity);
router.delete("/activities/:id", auth, c.deleteActivity);

module.exports = router;
