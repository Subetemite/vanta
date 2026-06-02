const express = require("express");
const router = express.Router();
const auth = require("../../middleware/authMiddleware");
const c = require("../../controllers/logistics/requisitionController");

router.get("/", auth, c.list);
router.get("/:id", auth, c.getOne);
router.post("/", auth, c.create);
router.put("/:id", auth, c.update);
router.delete("/:id", auth, c.remove);
router.post("/:id/approve", auth, c.approve);
router.post("/:id/deny", auth, c.deny);
router.post("/:id/issue", auth, c.issue);
router.post("/:id/complete", auth, c.complete);

module.exports = router;
