const Supplier = require("../../models/logistics/Supplier");

function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

exports.list = async (req, res) => {
  try {
    const filter = {};
    if (req.query.active === "true") filter.isActive = true;
    if (req.query.active === "false") filter.isActive = false;
    const q = String(req.query.q || "").trim();
    if (q) {
      const rx = new RegExp(escapeRegex(q), "i");
      filter.$or = [{ name: rx }, { contactPerson: rx }, { email: rx }, { phone: rx }, { category: rx }];
    }
    const suppliers = await Supplier.find(filter).sort({ name: 1 });
    res.json(suppliers);
  } catch (error) {
    res.status(500).json({ message: "Unable to load suppliers." });
  }
};

exports.getOne = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) return res.status(404).json({ message: "Supplier not found." });
    res.json(supplier);
  } catch (error) {
    res.status(500).json({ message: "Unable to fetch supplier." });
  }
};

exports.create = async (req, res) => {
  try {
    if (!req.body.name || !req.body.name.trim()) {
      return res.status(400).json({ message: "Supplier name is required." });
    }
    const supplier = await Supplier.create(req.body);
    res.status(201).json({ message: "Supplier added.", supplier });
  } catch (error) {
    res.status(500).json({ message: "Unable to add supplier." });
  }
};

exports.update = async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!supplier) return res.status(404).json({ message: "Supplier not found." });
    res.json({ message: "Supplier updated.", supplier });
  } catch (error) {
    res.status(500).json({ message: "Unable to update supplier." });
  }
};

exports.remove = async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndDelete(req.params.id);
    if (!supplier) return res.status(404).json({ message: "Supplier not found." });
    res.json({ message: "Supplier deleted." });
  } catch (error) {
    res.status(500).json({ message: "Unable to delete supplier." });
  }
};
