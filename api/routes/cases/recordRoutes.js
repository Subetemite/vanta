const express = require("express");
const router = express.Router();
const auth = require("../../middleware/authMiddleware");
const requirePermission = require("../../middleware/permissionMiddleware");

const {
  getRecords,
  getAIRecords,
  createRecord,
  updateRecord,
  deleteRecord,
  getRecordHistory,
} = require("../../controllers/cases/recordController");

router.get("/", auth, getRecords);
router.get("/ai", auth, getAIRecords);
router.post("/", auth, requirePermission("editIncidents"), createRecord);
router.put("/:id", auth, requirePermission("editIncidents"), updateRecord);
router.delete("/:id", auth, requirePermission("deleteRecords"), deleteRecord);
router.get("/:id/history", auth, getRecordHistory);

module.exports = router;
