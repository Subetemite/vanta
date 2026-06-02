const express = require("express");
const router = express.Router();
const auth = require("../../middleware/authMiddleware");
const { requireModuleEditor } = require("../../middleware/permissionMiddleware");
const { getOverview } = require("../../controllers/admin/overviewController");

router.get("/", (req, res) => {
  res.json({
    module: "admin",
    status: "active",
    features: { documents: "active", timekeeping: "scaffold", calendar: "scaffold" },
  });
});

router.get("/overview", auth, getOverview);

// Documents (routing slips) — tagged employees can view/update their assigned records,
// so this subrouter handles its own per-record auth and bypasses the module-editor gate.
router.use("/documents", require("./routingRoutes"));

router.use(auth, requireModuleEditor("admin"));

router.use("/hris", require("./hrisRoutes"));
router.use("/dtr", require("./dtrRoutes"));
router.use("/calendar", require("./calendarRoutes"));
router.use("/opcr", require("./opcrRoutes"));

module.exports = router;
