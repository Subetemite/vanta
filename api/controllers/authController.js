const User = require("../models/User");
const LoginHistory = require("../models/LoginHistory");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs/promises");
const path = require("path");

const MODULE_KEYS = ["admin", "cases", "logistics", "operations", "social"];
const MODULE_ROLE_VALUES = ["admin", "viewer"];

const UPLOADS_ROOT = path.join(__dirname, "..", "uploads");
const AVATARS_DIR = path.join(UPLOADS_ROOT, "avatars");
const DATA_URL_PREFIX = /^data:[^;]+;base64,/i;
const ALLOWED_AVATAR_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

function sanitizeBaseName(fileName = "") {
  return path
    .basename(fileName, path.extname(fileName))
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

async function saveAvatar(avatarBase64, avatarFileName) {
  const normalized = String(avatarBase64).replace(DATA_URL_PREFIX, "").replace(/\s/g, "");
  const buffer = Buffer.from(normalized, "base64");
  if (!buffer.length) {
    const err = new Error("Avatar is empty or invalid.");
    err.status = 400;
    throw err;
  }
  if (buffer.length > MAX_AVATAR_BYTES) {
    const err = new Error("Avatar must be 5 MB or smaller.");
    err.status = 400;
    throw err;
  }
  const ext = path.extname(avatarFileName || "").toLowerCase();
  if (ext && !ALLOWED_AVATAR_EXTENSIONS.includes(ext)) {
    const err = new Error("Avatar must be JPG, PNG, WEBP, or GIF.");
    err.status = 400;
    throw err;
  }
  const safe = sanitizeBaseName(avatarFileName) || "avatar";
  const storedName = `${Date.now()}-${safe}${ext || ".jpg"}`;
  await fs.mkdir(AVATARS_DIR, { recursive: true });
  await fs.writeFile(path.join(AVATARS_DIR, storedName), buffer);
  return `avatars/${storedName}`;
}

async function deleteAvatar(storedRelative) {
  if (!storedRelative) return;
  try {
    await fs.unlink(path.join(UPLOADS_ROOT, storedRelative));
  } catch {
    /* ignore missing file */
  }
}

function buildAvatarUrl(req, storedRelative) {
  if (!req || !storedRelative) return "";
  return `${req.protocol}://${req.get("host")}/uploads/${storedRelative}`;
}

function userJson(user, req) {
  return {
    id: user._id,
    username: user.username,
    email: user.email,
    role: user.role,
    permissions: user.permissions,
    modulePermissions: user.modulePermissions,
    moduleRoles: user.moduleRoles,
    employee: user.employee,
    avatarUrl: buildAvatarUrl(req, user.avatarStoredName),
  };
}

function buildAuthResponse(user, req) {
  const token = jwt.sign(
    {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
      username: user.username,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES || "1d" }
  );

  return {
    token,
    user: userJson(user, req),
  };
}

function normalizeRole(role) {
  return ["admin", "officer", "viewer"].includes(role) ? role : "viewer";
}

function normalizePermissions(permissions = {}) {
  return {
    createReports: Boolean(permissions.createReports),
    editIncidents: Boolean(permissions.editIncidents),
    deleteRecords: Boolean(permissions.deleteRecords),
    viewConfidentialData: Boolean(permissions.viewConfidentialData),
  };
}

function normalizeModulePermissions(modulePermissions = {}) {
  const result = {};
  for (const key of MODULE_KEYS) {
    result[key] = Boolean(modulePermissions[key]);
  }
  return result;
}

function normalizeModuleRoles(moduleRoles = {}) {
  const result = {};
  for (const key of MODULE_KEYS) {
    const value = moduleRoles[key];
    result[key] = MODULE_ROLE_VALUES.includes(value) ? value : "viewer";
  }
  return result;
}

function normalizeEmployee(employee) {
  if (!employee || typeof employee !== "object") return undefined;
  const id = String(employee.employeeId || "").trim();
  if (!id) return undefined;
  return {
    employeeId: id,
    firstName: String(employee.firstName || "").trim(),
    middleName: String(employee.middleName || "").trim(),
    lastName: String(employee.lastName || "").trim(),
    department: String(employee.department || "").trim(),
    position: String(employee.position || "").trim(),
    dateHired: employee.dateHired ? new Date(employee.dateHired) : null,
  };
}

function ensureAdmin(req, res) {
  if (req.user?.role !== "admin") {
    res.status(403).json({
      message: "Administrator access is required.",
    });
    return false;
  }

  return true;
}

exports.register = async (req, res) => {
  try {
    const { username, email, password, role, permissions, modulePermissions, moduleRoles, employee } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        message: "Username, email, and password are required.",
      });
    }

    const existingUser = await User.findOne({
      $or: [{ username }, { email: email.toLowerCase() }],
    });

    if (existingUser) {
      return res.status(409).json({
        message: "A user with that username or email already exists.",
      });
    }

    const employeeLink = normalizeEmployee(employee);
    if (employeeLink?.employeeId) {
      const linked = await User.findOne({ "employee.employeeId": employeeLink.employeeId }).select("_id");
      if (linked) {
        return res.status(409).json({
          message: `Employee "${employeeLink.employeeId}" already has a user account.`,
        });
      }
    }

    const hash = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      email: email.toLowerCase(),
      password: hash,
      role: normalizeRole(role),
      permissions: normalizePermissions(permissions),
      modulePermissions: normalizeModulePermissions(modulePermissions),
      moduleRoles: normalizeModuleRoles(moduleRoles),
      ...(employeeLink ? { employee: employeeLink } : {}),
    });

    return res.status(201).json({
      message: "User created successfully.",
      ...buildAuthResponse(user, req),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to create user.",
      error: error.message,
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { identifier, email, password } = req.body;
    const rawIdentifier = String(identifier || email || "").trim();

    if (!rawIdentifier || !password) {
      return res.status(400).json({
        message: "Email or username and password are required.",
      });
    }

    const lowered = rawIdentifier.toLowerCase();
    const user = await User.findOne({
      $or: [{ email: lowered }, { username: rawIdentifier }],
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid credentials.",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid credentials.",
      });
    }

    if (user.active === false) {
      return res.status(403).json({
        message: "This account has been disabled. Contact an administrator.",
      });
    }

    await LoginHistory.create({
      user: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      ipAddress: req.ip || req.headers["x-forwarded-for"] || "",
      userAgent: req.get("user-agent") || "",
      status: "success",
    });

    return res.status(200).json({
      message: "Login successful.",
      ...buildAuthResponse(user, req),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to sign in.",
      error: error.message,
    });
  }
};

exports.listLoginHistory = async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) {
      return;
    }

    const entries = await LoginHistory.find()
      .sort({ createdAt: -1 })
      .limit(200);

    return res.status(200).json({
      entries: entries.map((entry) => ({
        id: entry._id,
        userId: entry.user,
        username: entry.username,
        email: entry.email,
        role: entry.role,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
        status: entry.status,
        createdAt: entry.createdAt,
      })),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to load login history.",
      error: error.message,
    });
  }
};

exports.me = async (req, res) => {
  try {
    const user = await User.findById(req.user.sub).select(
      "_id username email role permissions modulePermissions moduleRoles employee avatarStoredName"
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    return res.status(200).json({ user: userJson(user, req) });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to validate session.",
      error: error.message,
    });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { username, email, avatarBase64, avatarFileName, clearAvatar } = req.body;
    const user = await User.findById(req.user.sub);
    if (!user) return res.status(404).json({ message: "User not found." });

    if (username !== undefined) {
      const trimmed = String(username).trim();
      if (!trimmed) return res.status(400).json({ message: "Username cannot be empty." });
      if (trimmed.length < 3) return res.status(400).json({ message: "Username must be at least 3 characters." });
      if (trimmed !== user.username) {
        const exists = await User.findOne({ username: trimmed, _id: { $ne: user._id } });
        if (exists) return res.status(400).json({ message: "Username is already taken." });
        user.username = trimmed;
      }
    }

    if (email !== undefined) {
      const trimmed = String(email).trim().toLowerCase();
      if (!trimmed) return res.status(400).json({ message: "Email cannot be empty." });
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
        return res.status(400).json({ message: "Provide a valid email address." });
      }
      if (trimmed !== user.email) {
        const exists = await User.findOne({ email: trimmed, _id: { $ne: user._id } });
        if (exists) return res.status(400).json({ message: "Email is already in use." });
        user.email = trimmed;
      }
    }

    if (avatarBase64) {
      const newStored = await saveAvatar(avatarBase64, avatarFileName);
      if (user.avatarStoredName) await deleteAvatar(user.avatarStoredName);
      user.avatarStoredName = newStored;
    } else if (clearAvatar) {
      if (user.avatarStoredName) await deleteAvatar(user.avatarStoredName);
      user.avatarStoredName = "";
    }

    await user.save();

    return res.status(200).json({ message: "Profile updated.", user: userJson(user, req) });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    return res.status(500).json({ message: "Unable to update profile.", error: error.message });
  }
};

exports.changeOwnPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current and new password are required." });
    }
    if (String(newPassword).length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters." });
    }

    const user = await User.findById(req.user.sub).select("+password password username email");
    if (!user) return res.status(404).json({ message: "User not found." });

    const match = await bcrypt.compare(String(currentPassword), user.password);
    if (!match) return res.status(400).json({ message: "Current password is incorrect." });

    user.password = await bcrypt.hash(String(newPassword), 10);
    await user.save();

    return res.status(200).json({ message: "Password updated successfully." });
  } catch (error) {
    return res.status(500).json({ message: "Unable to change password.", error: error.message });
  }
};

exports.listUsers = async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) {
      return;
    }

    const users = await User.find()
      .select("_id username email role active permissions modulePermissions moduleRoles employee createdAt updatedAt")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      users: users.map((user) => ({
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        active: user.active !== false,
        permissions: user.permissions,
        modulePermissions: user.modulePermissions,
        moduleRoles: user.moduleRoles,
        employee: user.employee,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to load users.",
      error: error.message,
    });
  }
};

exports.updateUserAccess = async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) {
      return;
    }

    const { role, password, permissions, modulePermissions, moduleRoles, active } = req.body;

    const hasUpdate =
      role !== undefined ||
      password !== undefined ||
      permissions !== undefined ||
      modulePermissions !== undefined ||
      moduleRoles !== undefined ||
      active !== undefined;

    if (!hasUpdate) {
      return res.status(400).json({
        message: "Provide a role, permissions, module assignments, password, or active flag to update.",
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    if (active === false && String(user._id) === String(req.user.sub)) {
      return res.status(400).json({
        message: "You cannot disable your own account.",
      });
    }

    if (role !== undefined) {
      user.role = normalizeRole(role);
    }

    if (permissions !== undefined) {
      user.permissions = normalizePermissions(permissions);
    }

    if (modulePermissions !== undefined) {
      user.modulePermissions = normalizeModulePermissions(modulePermissions);
    }

    if (moduleRoles !== undefined) {
      user.moduleRoles = normalizeModuleRoles(moduleRoles);
    }

    if (active !== undefined) {
      user.active = Boolean(active);
    }

    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }

    await user.save();

    return res.status(200).json({
      message: "User access updated successfully.",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        active: user.active !== false,
        permissions: user.permissions,
        modulePermissions: user.modulePermissions,
        moduleRoles: user.moduleRoles,
        employee: user.employee,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to update user access.",
      error: error.message,
    });
  }
};
