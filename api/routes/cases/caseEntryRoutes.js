const express = require("express");
const router = express.Router();
const auth = require("../../middleware/authMiddleware");
const requirePermission = require("../../middleware/permissionMiddleware");

const {
  listByCategory,
  getOne,
  create,
  update,
  remove,
  summary,
} = require("../../controllers/cases/caseEntryController");

router.get("/summary", auth, summary);
router.get("/:category", auth, listByCategory);
router.get("/:category/:id", auth, getOne);
router.post("/:category", auth, requirePermission("editIncidents"), create);
router.put("/:category/:id", auth, requirePermission("editIncidents"), update);
router.delete("/:category/:id", auth, requirePermission("deleteRecords"), remove);

module.exports = router;
