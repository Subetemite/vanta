const express = require("express");
const router = express.Router();
const auth = require("../../middleware/authMiddleware");
const c = require("../../controllers/social/postController");

router.get("/", auth, c.list);
router.post("/", auth, c.create);
router.put("/:id", auth, c.update);
router.delete("/:id", auth, c.remove);
router.post("/:id/flag", auth, c.flag);
router.post("/:id/unflag", auth, c.unflag);

module.exports = router;
