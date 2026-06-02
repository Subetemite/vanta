const SocialPost = require("../../models/social/SocialPost");
const SocialAccount = require("../../models/social/SocialAccount");

function escapeRegex(str) { return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

exports.list = async (req, res) => {
  try {
    const filter = {};
    if (req.query.platform) filter.platform = req.query.platform;
    if (req.query.account) filter.account = req.query.account;
    if (req.query.flagged === "true") filter.flagged = true;
    if (req.query.sentiment) filter.sentiment = req.query.sentiment;
    const q = String(req.query.q || "").trim();
    if (q) {
      const rx = new RegExp(escapeRegex(q), "i");
      filter.$or = [{ content: rx }, { extractedText: rx }, { accountHandle: rx }, { tags: rx }];
    }
    const posts = await SocialPost.find(filter).sort({ capturedAt: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: "Unable to load posts." });
  }
};

exports.create = async (req, res) => {
  try {
    if (!req.body.content?.trim() && !req.body.postUrl) {
      return res.status(400).json({ message: "Content or post URL is required." });
    }
    if (req.body.account && !req.body.accountHandle) {
      const acc = await SocialAccount.findById(req.body.account).select("handle platform");
      if (acc) {
        req.body.accountHandle = acc.handle;
        if (!req.body.platform) req.body.platform = acc.platform;
      }
    }
    const post = await SocialPost.create({ ...req.body, capturedBy: req.user?.sub || null });
    res.status(201).json({ message: "Post captured.", post });
  } catch (error) {
    res.status(500).json({ message: "Unable to capture post." });
  }
};

exports.update = async (req, res) => {
  try {
    const post = await SocialPost.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!post) return res.status(404).json({ message: "Post not found." });
    res.json({ message: "Post updated.", post });
  } catch (error) {
    res.status(500).json({ message: "Unable to update post." });
  }
};

exports.remove = async (req, res) => {
  try {
    const post = await SocialPost.findByIdAndDelete(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found." });
    res.json({ message: "Post deleted." });
  } catch (error) {
    res.status(500).json({ message: "Unable to delete post." });
  }
};

exports.flag = async (req, res) => {
  try {
    const post = await SocialPost.findByIdAndUpdate(
      req.params.id,
      { flagged: true, flagReason: req.body.reason || "" },
      { new: true }
    );
    if (!post) return res.status(404).json({ message: "Post not found." });
    res.json({ message: "Post flagged.", post });
  } catch (error) {
    res.status(500).json({ message: "Unable to flag post." });
  }
};

exports.unflag = async (req, res) => {
  try {
    const post = await SocialPost.findByIdAndUpdate(
      req.params.id,
      { flagged: false, flagReason: "" },
      { new: true }
    );
    if (!post) return res.status(404).json({ message: "Post not found." });
    res.json({ message: "Post unflagged.", post });
  } catch (error) {
    res.status(500).json({ message: "Unable to unflag post." });
  }
};
