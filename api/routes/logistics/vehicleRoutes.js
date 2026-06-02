const express = require("express");
const router = express.Router();
const auth = require("../../middleware/authMiddleware");
const c = require("../../controllers/logistics/vehicleController");

router.get("/", auth, c.list);
router.get("/:id", auth, c.getOne);
router.post("/", auth, c.create);
router.put("/:id", auth, c.update);
router.delete("/:id", auth, c.remove);
router.post("/:id/dispatch", auth, c.dispatch);
router.post("/:id/return", auth, c.returnVehicle);

module.exports = router;
