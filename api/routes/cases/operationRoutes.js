const express = require("express");
const router = express.Router();

const {
  getOperations,
  getAIOperations,
  createOperation,
  updateOperation,
} = require("../../controllers/cases/operationController");

router.get("/", getOperations);
router.get("/ai", getAIOperations);
router.post("/", createOperation);
router.put("/:id", updateOperation);

module.exports = router;
