const CaseEntry = require("../../models/cases/CaseEntry");
const { CASE_CATEGORIES } = CaseEntry;

function assertCategory(category, res) {
  if (!CASE_CATEGORIES.includes(category)) {
    res.status(400).json({ message: `Unknown case category: ${category}.` });
    return false;
  }
  return true;
}

function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

exports.listByCategory = async (req, res) => {
  const { category } = req.params;
  if (!assertCategory(category, res)) return;
  try {
    const filter = { category };
    if (req.query.subCategory) filter.subCategory = req.query.subCategory;
    if (req.query.status) filter.status = req.query.status;

    const q = String(req.query.q || "").trim();
    if (q) {
      const rx = new RegExp(escapeRegex(q), "i");
      filter.$or = [
        { title: rx },
        { description: rx },
        { referenceNo: rx },
        { leadAgency: rx },
        { location: rx },
        { tags: rx },
      ];
    }

    const entries = await CaseEntry.find(filter).sort({ createdAt: -1 });
    res.json(entries);
  } catch (error) {
    res.status(500).json({ message: "Unable to fetch case entries right now." });
  }
};

exports.getOne = async (req, res) => {
  const { category, id } = req.params;
  if (!assertCategory(category, res)) return;
  try {
    const entry = await CaseEntry.findOne({ _id: id, category });
    if (!entry) return res.status(404).json({ message: "Case entry not found." });
    res.json(entry);
  } catch (error) {
    res.status(500).json({ message: "Unable to fetch the case entry." });
  }
};

exports.create = async (req, res) => {
  const { category } = req.params;
  if (!assertCategory(category, res)) return;
  try {
    const { title } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Title is required." });
    }
    const entry = await CaseEntry.create({
      ...req.body,
      category,
      createdBy: req.user?.sub || null,
    });
    res.status(201).json({ message: "Case entry saved.", entry });
  } catch (error) {
    res.status(500).json({ message: "Unable to save the case entry." });
  }
};

exports.update = async (req, res) => {
  const { category, id } = req.params;
  if (!assertCategory(category, res)) return;
  try {
    const updates = { ...req.body };
    delete updates.category;
    delete updates.createdBy;

    const entry = await CaseEntry.findOneAndUpdate(
      { _id: id, category },
      updates,
      { new: true, runValidators: true }
    );
    if (!entry) return res.status(404).json({ message: "Case entry not found." });
    res.json({ message: "Case entry updated.", entry });
  } catch (error) {
    res.status(500).json({ message: "Unable to update the case entry." });
  }
};

exports.remove = async (req, res) => {
  const { category, id } = req.params;
  if (!assertCategory(category, res)) return;
  try {
    const entry = await CaseEntry.findOneAndDelete({ _id: id, category });
    if (!entry) return res.status(404).json({ message: "Case entry not found." });
    res.json({ message: "Case entry deleted." });
  } catch (error) {
    res.status(500).json({ message: "Unable to delete the case entry." });
  }
};

exports.summary = async (req, res) => {
  try {
    const counts = await CaseEntry.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);
    const map = Object.fromEntries(CASE_CATEGORIES.map((c) => [c, 0]));
    counts.forEach((row) => {
      map[row._id] = row.count;
    });
    res.json({ categories: map, total: Object.values(map).reduce((a, b) => a + b, 0) });
  } catch (error) {
    res.status(500).json({ message: "Unable to compute summary." });
  }
};
