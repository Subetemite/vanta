const express = require("express");
const router = express.Router();
const auth = require("../../middleware/authMiddleware");
const c = require("../../controllers/admin/dtrController");

router.get("/meta", auth, c.getMeta);

router.get("/time-logs", auth, c.listTimeLogs);
router.post("/time-logs", auth, c.createTimeLog);
router.put("/time-logs/:id", auth, c.updateTimeLog);
router.delete("/time-logs/:id", auth, c.deleteTimeLog);

router.get("/leaves", auth, c.listLeaves);
router.post("/leaves", auth, c.createLeave);
router.put("/leaves/:id", auth, c.updateLeave);
router.delete("/leaves/:id", auth, c.deleteLeave);

router.get("/special-orders", auth, c.listSpecialOrders);
router.post("/special-orders", auth, c.createSpecialOrder);
router.put("/special-orders/:id", auth, c.updateSpecialOrder);
router.delete("/special-orders/:id", auth, c.deleteSpecialOrder);

router.get("/operations", auth, c.listOperations);
router.post("/operations", auth, c.createOperation);
router.put("/operations/:id", auth, c.updateOperation);
router.delete("/operations/:id", auth, c.deleteOperation);

module.exports = router;
