const express = require("express");
const router = express.Router();
const auth = require("../../middleware/authMiddleware");
const { requireModuleEditor } = require("../../middleware/permissionMiddleware");
const dashboard = require("../../controllers/logistics/dashboardController");

router.get("/overview", auth, dashboard.overview);

router.use(auth, requireModuleEditor("logistics"));

router.use("/inventory", require("./inventoryRoutes"));
router.use("/vehicles", require("./vehicleRoutes"));
router.use("/suppliers", require("./supplierRoutes"));
router.use("/requisitions", require("./requisitionRoutes"));
router.use("/maintenance", require("./maintenanceRoutes"));
router.use("/ict", require("./ictRoutes"));

module.exports = router;
