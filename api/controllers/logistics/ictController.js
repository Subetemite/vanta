const fs = require("fs/promises");
const path = require("path");
const IctAsset = require("../../models/logistics/IctAsset");

const UPLOADS_ROOT = path.join(__dirname, "..", "..", "uploads");
const ICT_DIR = path.join(UPLOADS_ROOT, "ict");
const DATA_URL_PREFIX = /^data:[^;]+;base64,/i;
const ALLOWED_PHOTO_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function sanitizeBaseName(fileName = "") {
  return path
    .basename(fileName, path.extname(fileName))
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

async function savePhoto(photoBase64, photoFileName) {
  const normalized = String(photoBase64).replace(DATA_URL_PREFIX, "").replace(/\s/g, "");
  const buffer = Buffer.from(normalized, "base64");
  if (!buffer.length) {
    const err = new Error("Photo is empty or invalid.");
    err.status = 400;
    throw err;
  }
  if (buffer.length > MAX_PHOTO_BYTES) {
    const err = new Error("Photo must be 5 MB or smaller.");
    err.status = 400;
    throw err;
  }
  const ext = path.extname(photoFileName || "").toLowerCase();
  if (ext && !ALLOWED_PHOTO_EXTENSIONS.includes(ext)) {
    const err = new Error("Photo must be JPG, PNG, WEBP, or GIF.");
    err.status = 400;
    throw err;
  }
  const safe = sanitizeBaseName(photoFileName) || "ict-asset";
  const storedName = `${Date.now()}-${safe}${ext || ".jpg"}`;
  await fs.mkdir(ICT_DIR, { recursive: true });
  await fs.writeFile(path.join(ICT_DIR, storedName), buffer);
  return `ict/${storedName}`;
}

async function deletePhoto(storedRelative) {
  if (!storedRelative) return;
  try {
    await fs.unlink(path.join(UPLOADS_ROOT, storedRelative));
  } catch {
    /* ignore missing file */
  }
}

function buildPhotoUrl(req, storedRelative) {
  if (!storedRelative) return "";
  return `${req.protocol}://${req.get("host")}/uploads/${storedRelative}`;
}

function toResponse(req, asset) {
  if (!asset) return asset;
  const obj = typeof asset.toObject === "function" ? asset.toObject() : { ...asset };
  obj.photoUrl = buildPhotoUrl(req, obj.photoStoredName);
  return obj;
}

exports.list = async (req, res) => {
  try {
    const filter = {};
    if (req.query.scope) filter.scope = req.query.scope;
    if (req.query.category) filter.category = req.query.category;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.condition) filter.condition = req.query.condition;
    if (req.query.department) filter.department = req.query.department;
    const q = String(req.query.q || "").trim();
    if (q) {
      const rx = new RegExp(escapeRegex(q), "i");
      filter.$or = [
        { name: rx },
        { assetTag: rx },
        { serialNo: rx },
        { brand: rx },
        { model: rx },
        { hostname: rx },
        { ipAddress: rx },
        { macAddress: rx },
        { assignedTo: rx },
        { department: rx },
        { location: rx },
        { supplierName: rx },
      ];
    }
    const items = await IctAsset.find(filter).sort({ updatedAt: -1 });
    res.json(items.map((i) => toResponse(req, i)));
  } catch (error) {
    res.status(500).json({ message: "Unable to load ICT assets." });
  }
};

exports.getOne = async (req, res) => {
  try {
    const item = await IctAsset.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "ICT asset not found." });
    res.json(toResponse(req, item));
  } catch (error) {
    res.status(500).json({ message: "Unable to fetch ICT asset." });
  }
};

exports.create = async (req, res) => {
  try {
    const { photoBase64, photoFileName, clearPhoto, photoUrl, ...data } = req.body;
    if (!data.name || !data.name.trim()) {
      return res.status(400).json({ message: "Asset name is required." });
    }
    if (!data.assetTag || !String(data.assetTag).trim()) {
      data.assetTag = `ICT-${Date.now().toString(36).toUpperCase()}`;
    }
    if (photoBase64) {
      data.photoStoredName = await savePhoto(photoBase64, photoFileName);
    }
    const item = await IctAsset.create(data);
    res.status(201).json({ message: "ICT asset created.", item: toResponse(req, item) });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Asset tag already in use." });
    }
    if (error.status) return res.status(error.status).json({ message: error.message });
    res.status(500).json({ message: "Unable to create ICT asset." });
  }
};

exports.update = async (req, res) => {
  try {
    const { photoBase64, photoFileName, clearPhoto, photoUrl, ...data } = req.body;
    const existing = await IctAsset.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: "ICT asset not found." });

    if (photoBase64) {
      const newStored = await savePhoto(photoBase64, photoFileName);
      if (existing.photoStoredName) await deletePhoto(existing.photoStoredName);
      data.photoStoredName = newStored;
    } else if (clearPhoto) {
      if (existing.photoStoredName) await deletePhoto(existing.photoStoredName);
      data.photoStoredName = "";
    }

    Object.assign(existing, data);
    await existing.save();
    res.json({ message: "ICT asset updated.", item: toResponse(req, existing) });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Asset tag already in use." });
    }
    if (error.status) return res.status(error.status).json({ message: error.message });
    res.status(500).json({ message: "Unable to update ICT asset." });
  }
};

exports.remove = async (req, res) => {
  try {
    const item = await IctAsset.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: "ICT asset not found." });
    if (item.photoStoredName) await deletePhoto(item.photoStoredName);
    res.json({ message: "ICT asset deleted." });
  } catch (error) {
    res.status(500).json({ message: "Unable to delete ICT asset." });
  }
};

exports.assign = async (req, res) => {
  try {
    const { assignedTo, department, location, deployedAt } = req.body;
    const item = await IctAsset.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "ICT asset not found." });
    if (assignedTo !== undefined) item.assignedTo = assignedTo;
    if (department !== undefined) item.department = department;
    if (location !== undefined) item.location = location;
    item.deployedAt = deployedAt ? new Date(deployedAt) : new Date();
    if (item.assignedTo) item.status = "deployed";
    await item.save();
    res.json({ message: "ICT asset assigned.", item: toResponse(req, item) });
  } catch (error) {
    res.status(500).json({ message: "Unable to assign ICT asset." });
  }
};
