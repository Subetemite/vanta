const express = require("express");
const router = express.Router();
const auth = require("../../middleware/authMiddleware");
const { requireModuleEditor } = require("../../middleware/permissionMiddleware");
const dashboard = require("../../controllers/operations/dashboardController");

router.get("/overview", auth, dashboard.overview);

router.use(auth, requireModuleEditor("operations"));

router.use("/missions", require("./missionRoutes"));
router.use("/deployments", require("./deploymentRoutes"));
router.use("/sitreps", require("./sitrepRoutes"));
router.use("/after-actions", require("./afterActionRoutes"));
router.use("/case-inventory", require("./caseInventoryRoutes"));

module.exports = router;
