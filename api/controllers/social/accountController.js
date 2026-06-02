const SocialAccount = require("../../models/social/SocialAccount");

function escapeRegex(str) { return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

exports.list = async (req, res) => {
  try {
    const filter = {};
    if (req.query.platform) filter.platform = req.query.platform;
    if (req.query.accountType) filter.accountType = req.query.accountType;
    if (req.query.status) filter.status = req.query.status;
    const q = String(req.query.q || "").trim();
    if (q) {
      const rx = new RegExp(escapeRegex(q), "i");
      filter.$or = [{ handle: rx }, { displayName: rx }, { suspectedRealName: rx }, { location: rx }, { tags: rx }];
    }
    const accounts = await SocialAccount.find(filter).sort({ updatedAt: -1 });
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ message: "Unable to load accounts." });
  }
};

exports.create = async (req, res) => {
  try {
    if (!req.body.handle?.trim()) return res.status(400).json({ message: "Handle is required." });
    if (!req.body.platform) return res.status(400).json({ message: "Platform is required." });
    const account = await SocialAccount.create({ ...req.body, addedBy: req.user?.sub || null });
    res.status(201).json({ message: "Account added.", account });
  } catch (error) {
    res.status(500).json({ message: "Unable to add account." });
  }
};

exports.update = async (req, res) => {
  try {
    const account = await SocialAccount.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!account) return res.status(404).json({ message: "Account not found." });
    res.json({ message: "Account updated.", account });
  } catch (error) {
    res.status(500).json({ message: "Unable to update account." });
  }
};

exports.remove = async (req, res) => {
  try {
    const account = await SocialAccount.findByIdAndDelete(req.params.id);
    if (!account) return res.status(404).json({ message: "Account not found." });
    res.json({ message: "Account removed." });
  } catch (error) {
    res.status(500).json({ message: "Unable to delete account." });
  }
};
