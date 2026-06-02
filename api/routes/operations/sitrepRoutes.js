const express = require("express");
const router = express.Router();
const auth = require("../../middleware/authMiddleware");
const c = require("../../controllers/operations/sitrepController");

router.get("/", auth, c.list);
router.post("/", auth, c.create);
router.put("/:id", auth, c.update);
router.delete("/:id", auth, c.remove);

module.exports = router;
