const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const { listFiles, uploadFile } = require("../controllers/fileController");

router.get("/", authMiddleware, listFiles);
router.post("/", authMiddleware, uploadFile);

module.exports = router;
