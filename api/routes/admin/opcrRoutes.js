const express = require("express");
const router = express.Router();
const auth = require("../../middleware/authMiddleware");
const c = require("../../controllers/admin/opcrController");

router.get("/meta", auth, c.getMeta);
router.get("/", auth, c.list);
router.get("/:id", auth, c.get);
router.post("/", auth, c.create);
router.put("/:id", auth, c.update);
router.delete("/:id", auth, c.remove);

module.exports = router;
