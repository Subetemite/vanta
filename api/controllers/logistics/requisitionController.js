const Requisition = require("../../models/logistics/Requisition");
const InventoryItem = require("../../models/logistics/InventoryItem");

function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function nextRefNo() {
  const year = new Date().getFullYear();
  const prefix = `REQ-${year}-`;
  const last = await Requisition.findOne({ refNo: new RegExp(`^${prefix}`) })
    .sort({ refNo: -1 })
    .select("refNo");
  let n = 1;
  if (last?.refNo) {
    const tail = last.refNo.slice(prefix.length);
    const parsed = parseInt(tail, 10);
    if (!isNaN(parsed)) n = parsed + 1;
  }
  return `${prefix}${String(n).padStart(4, "0")}`;
}

exports.list = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.priority) filter.priority = req.query.priority;
    const q = String(req.query.q || "").trim();
    if (q) {
      const rx = new RegExp(escapeRegex(q), "i");
      filter.$or = [
        { refNo: rx },
        { purpose: rx },
        { "requestor.name": rx },
        { "requestor.unit": rx },
      ];
    }
    const items = await Requisition.find(filter).sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: "Unable to load requisitions." });
  }
};

exports.getOne = async (req, res) => {
  try {
    const item = await Requisition.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Requisition not found." });
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: "Unable to fetch requisition." });
  }
};

exports.create = async (req, res) => {
  try {
    const items = Array.isArray(req.body.items) ? req.body.items.filter((x) => x && x.name?.trim()) : [];
    if (!items.length) return res.status(400).json({ message: "At least one line item is required." });
    const refNo = req.body.refNo || (await nextRefNo());
    const requisition = await Requisition.create({
      ...req.body,
      refNo,
      items,
      createdBy: req.user?.sub || null,
    });
    res.status(201).json({ message: "Requisition created.", requisition });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ message: "Reference number already used." });
    res.status(500).json({ message: "Unable to create requisition." });
  }
};

exports.update = async (req, res) => {
  try {
    const updates = { ...req.body };
    delete updates.refNo;
    delete updates.createdBy;
    const requisition = await Requisition.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!requisition) return res.status(404).json({ message: "Requisition not found." });
    res.json({ message: "Requisition updated.", requisition });
  } catch (error) {
    res.status(500).json({ message: "Unable to update requisition." });
  }
};

exports.remove = async (req, res) => {
  try {
    const requisition = await Requisition.findByIdAndDelete(req.params.id);
    if (!requisition) return res.status(404).json({ message: "Requisition not found." });
    res.json({ message: "Requisition deleted." });
  } catch (error) {
    res.status(500).json({ message: "Unable to delete requisition." });
  }
};

exports.approve = async (req, res) => {
  try {
    const approver = req.body.approvedBy || req.user?.username || "";
    const requisition = await Requisition.findByIdAndUpdate(
      req.params.id,
      { status: "approved", approvedBy: approver, approvedAt: new Date(), denialReason: "" },
      { new: true }
    );
    if (!requisition) return res.status(404).json({ message: "Requisition not found." });
    res.json({ message: "Requisition approved.", requisition });
  } catch (error) {
    res.status(500).json({ message: "Unable to approve requisition." });
  }
};

exports.deny = async (req, res) => {
  try {
    const requisition = await Requisition.findByIdAndUpdate(
      req.params.id,
      { status: "denied", denialReason: req.body.reason || "", approvedBy: req.user?.username || "" },
      { new: true }
    );
    if (!requisition) return res.status(404).json({ message: "Requisition not found." });
    res.json({ message: "Requisition denied.", requisition });
  } catch (error) {
    res.status(500).json({ message: "Unable to deny requisition." });
  }
};

exports.issue = async (req, res) => {
  try {
    const requisition = await Requisition.findById(req.params.id);
    if (!requisition) return res.status(404).json({ message: "Requisition not found." });
    if (requisition.status !== "approved") {
      return res.status(400).json({ message: "Only approved requisitions can be issued." });
    }

    // Decrement stock for items linked to inventory
    for (const line of requisition.items) {
      if (line.inventoryItem) {
        await InventoryItem.findByIdAndUpdate(line.inventoryItem, {
          $inc: { quantity: -Math.abs(line.quantity || 0) },
        });
      }
    }

    requisition.status = "issued";
    requisition.issuedBy = req.body.issuedBy || req.user?.username || "";
    requisition.issuedAt = new Date();
    await requisition.save();
    res.json({ message: "Requisition issued and stock updated.", requisition });
  } catch (error) {
    res.status(500).json({ message: "Unable to issue requisition." });
  }
};

exports.complete = async (req, res) => {
  try {
    const requisition = await Requisition.findByIdAndUpdate(
      req.params.id,
      { status: "completed", completedAt: new Date() },
      { new: true }
    );
    if (!requisition) return res.status(404).json({ message: "Requisition not found." });
    res.json({ message: "Requisition completed.", requisition });
  } catch (error) {
    res.status(500).json({ message: "Unable to complete requisition." });
  }
};
