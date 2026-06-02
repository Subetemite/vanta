const User = require("../models/User");

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

module.exports = (permission) => async (req, res, next) => {
  if (req.user?.role === "admin") return next();

  try {
    const user = await User.findById(req.user?.sub).select("permissions role");
    if (!user) return res.status(401).json({ message: "User not found." });

    if (!user.permissions?.[permission]) {
      return res.status(403).json({ message: "You do not have permission to perform this action." });
    }

    next();
  } catch {
    return res.status(500).json({ message: "Permission check failed." });
  }
};

module.exports.requireModuleEditor = (moduleKey) => async (req, res, next) => {
  if (SAFE_METHODS.has(req.method)) return next();
  if (req.user?.role === "admin") return next();

  try {
    const user = await User.findById(req.user?.sub).select("role moduleRoles modulePermissions");
    if (!user) return res.status(401).json({ message: "User not found." });

    if (!user.modulePermissions?.[moduleKey]) {
      return res.status(403).json({ message: "You do not have access to this module." });
    }

    if (user.moduleRoles?.[moduleKey] !== "admin") {
      return res.status(403).json({
        message: "Read-only access — you cannot create, update, or delete records in this module.",
      });
    }

    next();
  } catch {
    return res.status(500).json({ message: "Module permission check failed." });
  }
};
