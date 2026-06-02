const express = require("express");
const router = express.Router();
const auth = require("../../middleware/authMiddleware");
const c = require("../../controllers/operations/caseInventoryController");

router.get("/inventory", auth, c.listInventory);
router.get("/ict", auth, c.listIct);
router.get("/vehicles", auth, c.listVehicles);

module.exports = router;
