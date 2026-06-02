const express = require("express");
const router = express.Router();
const auth = require("../../middleware/authMiddleware");
const {
  getMeta,
  listEmployees,
  listUnlinkedEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  createDocument,
  updateDocument,
  deleteDocument,
} = require("../../controllers/admin/hrisController");

router.get("/meta", auth, getMeta);

router.get("/employees", auth, listEmployees);
router.get("/employees/unlinked", auth, listUnlinkedEmployees);
router.post("/employees", auth, createEmployee);
router.get("/employees/:id", auth, getEmployee);
router.put("/employees/:id", auth, updateEmployee);
router.delete("/employees/:id", auth, deleteEmployee);

router.post("/employees/:employeeId/documents", auth, createDocument);
router.put("/employees/:employeeId/documents/:id", auth, updateDocument);
router.delete("/employees/:employeeId/documents/:id", auth, deleteDocument);

module.exports = router;
