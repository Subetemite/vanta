const InventoryItem = require("../../models/logistics/InventoryItem");
const IctAsset = require("../../models/logistics/IctAsset");
const Vehicle = require("../../models/logistics/Vehicle");

function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildPhotoUrl(req, storedRelative) {
  if (!storedRelative) return "";
  return `${req.protocol}://${req.get("host")}/uploads/${storedRelative}`;
}

function withPhoto(req, doc) {
  if (!doc) return doc;
  const obj = typeof doc.toObject === "function" ? doc.toObject() : { ...doc };
  obj.photoUrl = buildPhotoUrl(req, obj.photoStoredName);
  return obj;
}

exports.listInventory = async (req, res) => {
  try {
    const filter = { scope: "case" };
    if (req.query.category) filter.category = req.query.category;
    if (req.query.status) filter.status = req.query.status;
    const q = String(req.query.q || "").trim();
    if (q) {
      const rx = new RegExp(escapeRegex(q), "i");
      filter.$or = [{ name: rx }, { sku: rx }, { location: rx }, { supplierName: rx }, { description: rx }];
    }
    const items = await InventoryItem.find(filter).sort({ updatedAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: "Unable to load case inventory." });
  }
};

exports.listIct = async (req, res) => {
  try {
    const filter = { scope: "case" };
    if (req.query.category) filter.category = req.query.category;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.condition) filter.condition = req.query.condition;
    const q = String(req.query.q || "").trim();
    if (q) {
      const rx = new RegExp(escapeRegex(q), "i");
      filter.$or = [
        { name: rx }, { assetTag: rx }, { serialNo: rx },
        { brand: rx }, { model: rx }, { hostname: rx },
        { ipAddress: rx }, { macAddress: rx },
        { assignedTo: rx }, { department: rx }, { location: rx },
      ];
    }
    const items = await IctAsset.find(filter).sort({ updatedAt: -1 });
    res.json(items.map((i) => withPhoto(req, i)));
  } catch (error) {
    res.status(500).json({ message: "Unable to load case ICT assets." });
  }
};

exports.listVehicles = async (req, res) => {
  try {
    const filter = { scope: "case" };
    if (req.query.status) filter.status = req.query.status;
    if (req.query.type) filter.type = req.query.type;
    const q = String(req.query.q || "").trim();
    if (q) {
      const rx = new RegExp(escapeRegex(q), "i");
      filter.$or = [
        { plateNo: rx }, { engineNo: rx }, { chassisNo: rx },
        { make: rx }, { model: rx }, { assignedUnit: rx },
        { currentDriver: rx }, { registeredOwner: rx },
      ];
    }
    const items = await Vehicle.find(filter).sort({ updatedAt: -1 });
    res.json(items.map((v) => withPhoto(req, v)));
  } catch (error) {
    res.status(500).json({ message: "Unable to load case vehicles." });
  }
};
