const express = require("express");
const router = express.Router();
const requirePermission = require("../../middleware/permissionMiddleware");
const c = require("../../controllers/cases/caseFolderController");

// List by category, e.g. /cases/folders/inter-agency
router.get("/:category", c.list);

// Folder CRUD by id
router.get("/id/:id", c.getOne);
router.post("/", requirePermission("editIncidents"), c.create);
router.put("/id/:id", requirePermission("editIncidents"), c.update);
router.delete("/id/:id", requirePermission("deleteRecords"), c.remove);

// Files within a folder
router.post("/id/:id/files", requirePermission("editIncidents"), c.uploadFile);
router.get("/id/:id/files/:fileId/text", c.getFileText);
router.delete("/id/:id/files/:fileId", requirePermission("deleteRecords"), c.removeFile);

module.exports = router;
