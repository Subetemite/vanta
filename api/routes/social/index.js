const express = require("express");
const router = express.Router();
const auth = require("../../middleware/authMiddleware");
const { requireModuleEditor } = require("../../middleware/permissionMiddleware");
const dashboard = require("../../controllers/social/dashboardController");

router.get("/overview", auth, dashboard.overview);

router.use(auth, requireModuleEditor("social"));

router.use("/accounts", require("./accountRoutes"));
router.use("/posts", require("./postRoutes"));
router.use("/alerts", require("./alertRoutes"));
router.use("/campaigns", require("./campaignRoutes"));

module.exports = router;
