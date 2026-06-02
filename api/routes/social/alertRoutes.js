const express = require("express");
const router = express.Router();
const auth = require("../../middleware/authMiddleware");
const c = require("../../controllers/social/alertController");

router.get("/", auth, c.list);
router.post("/", auth, c.create);
router.put("/:id", auth, c.update);
router.delete("/:id", auth, c.remove);
router.post("/:id/transition", auth, c.transition);

module.exports = router;
