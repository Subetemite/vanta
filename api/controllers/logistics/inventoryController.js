const InventoryItem = require("../../models/logistics/InventoryItem");

function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

exports.list = async (req, res) => {
  try {
    const filter = {};
    if (req.query.scope) filter.scope = req.query.scope;
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
    res.status(500).json({ message: "Unable to load inventory." });
  }
};

exports.getOne = async (req, res) => {
  try {
    const item = await InventoryItem.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found." });
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: "Unable to fetch item." });
  }
};

exports.create = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ message: "Item name is required." });
    if (!req.body.sku) {
      req.body.sku = `INV-${Date.now().toString(36).toUpperCase()}`;
    }
    const item = await InventoryItem.create(req.body);
    res.status(201).json({ message: "Inventory item created.", item });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ message: "SKU already in use." });
    res.status(500).json({ message: "Unable to create item." });
  }
};

exports.update = async (req, res) => {
  try {
    const item = await InventoryItem.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found." });
    Object.assign(item, req.body);
    await item.save();
    res.json({ message: "Inventory item updated.", item });
  } catch (error) {
    res.status(500).json({ message: "Unable to update item." });
  }
};

exports.remove = async (req, res) => {
  try {
    const item = await InventoryItem.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found." });
    res.json({ message: "Inventory item deleted." });
  } catch (error) {
    res.status(500).json({ message: "Unable to delete item." });
  }
};

exports.adjustStock = async (req, res) => {
  try {
    const { delta, reason } = req.body;
    const numeric = Number(delta);
    if (Number.isNaN(numeric)) return res.status(400).json({ message: "Delta must be a number." });
    const item = await InventoryItem.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found." });
    item.quantity = Math.max(0, item.quantity + numeric);
    if (reason) item.notes = `${item.notes || ""}\n[${new Date().toISOString()}] adjust ${numeric}: ${reason}`.trim();
    await item.save();
    res.json({ message: "Stock adjusted.", item });
  } catch (error) {
    res.status(500).json({ message: "Unable to adjust stock." });
  }
};
