const express = require("express");
const router = express.Router();
const auth = require("../../middleware/authMiddleware");
const c = require("../../controllers/logistics/maintenanceController");

router.get("/", auth, c.list);
router.get("/:id", auth, c.getOne);
router.post("/", auth, c.create);
router.put("/:id", auth, c.update);
router.delete("/:id", auth, c.remove);

module.exports = router;
