const express = require("express");
const router = express.Router();
const auth = require("../../middleware/authMiddleware");
const { requireModuleEditor } = require("../../middleware/permissionMiddleware");

router.use(auth, requireModuleEditor("cases"));

router.use("/records", require("./recordRoutes"));
router.use("/operations", require("./operationRoutes"));
router.use("/entries", require("./caseEntryRoutes"));
router.use("/folders", require("./caseFolderRoutes"));

module.exports = router;
