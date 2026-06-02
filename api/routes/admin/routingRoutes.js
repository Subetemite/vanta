const express = require("express");
const router = express.Router();
const auth = require("../../middleware/authMiddleware");
const {
  listRecords,
  getRecord,
  createRecord,
  updateRecord,
  deleteRecord,
  addComment,
  getMeta,
} = require("../../controllers/admin/routingController");

router.get("/meta", auth, getMeta);
router.get("/", auth, listRecords);
router.get("/:id", auth, getRecord);
router.post("/", auth, createRecord);
router.put("/:id", auth, updateRecord);
router.post("/:id/comments", auth, addComment);
router.delete("/:id", auth, deleteRecord);

module.exports = router;
