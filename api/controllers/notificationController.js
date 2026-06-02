const Notification = require("../models/Notification");

function toResponse(n) {
  return {
    id: n._id,
    type: n.type,
    title: n.title,
    message: n.message,
    link: n.link,
    read: n.read,
    meta: n.meta || {},
    createdAt: n.createdAt,
    updatedAt: n.updatedAt,
  };
}

exports.listMine = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user.sub })
      .sort({ createdAt: -1 })
      .limit(50);
    const unreadCount = await Notification.countDocuments({ user: req.user.sub, read: false });
    res.json({
      notifications: notifications.map(toResponse),
      unreadCount,
    });
  } catch (error) {
    res.status(500).json({ message: "Unable to load notifications." });
  }
};

exports.unreadCount = async (req, res) => {
  try {
    const unreadCount = await Notification.countDocuments({ user: req.user.sub, read: false });
    res.json({ unreadCount });
  } catch (error) {
    res.status(500).json({ message: "Unable to load notifications." });
  }
};

exports.markRead = async (req, res) => {
  try {
    const n = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user.sub },
      { $set: { read: true } },
      { new: true }
    );
    if (!n) return res.status(404).json({ message: "Notification not found." });
    res.json({ notification: toResponse(n) });
  } catch (error) {
    res.status(500).json({ message: "Unable to update notification." });
  }
};

exports.markAllRead = async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user.sub, read: false }, { $set: { read: true } });
    res.json({ message: "All notifications marked as read." });
  } catch (error) {
    res.status(500).json({ message: "Unable to update notifications." });
  }
};

exports.createForUsers = async function createForUsers(userIds, payload) {
  const ids = Array.from(new Set(userIds.filter(Boolean).map((id) => String(id))));
  if (!ids.length) return [];
  const docs = ids.map((userId) => ({
    user: userId,
    type: payload.type || "general",
    title: payload.title || "",
    message: payload.message || "",
    link: payload.link || "",
    meta: payload.meta || {},
  }));
  return Notification.insertMany(docs);
};
