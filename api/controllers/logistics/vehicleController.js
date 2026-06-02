const fs = require("fs/promises");
const path = require("path");
const Vehicle = require("../../models/logistics/Vehicle");

const UPLOADS_ROOT = path.join(__dirname, "..", "..", "uploads");
const VEHICLES_DIR = path.join(UPLOADS_ROOT, "vehicles");
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
  const safe = sanitizeBaseName(photoFileName) || "vehicle";
  const storedName = `${Date.now()}-${safe}${ext || ".jpg"}`;
  await fs.mkdir(VEHICLES_DIR, { recursive: true });
  await fs.writeFile(path.join(VEHICLES_DIR, storedName), buffer);
  return `vehicles/${storedName}`;
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

function toResponse(req, vehicle) {
  if (!vehicle) return vehicle;
  const obj = typeof vehicle.toObject === "function" ? vehicle.toObject() : { ...vehicle };
  obj.photoUrl = buildPhotoUrl(req, obj.photoStoredName);
  return obj;
}

exports.list = async (req, res) => {
  try {
    const filter = {};
    if (req.query.scope) filter.scope = req.query.scope;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.type) filter.type = req.query.type;
    const q = String(req.query.q || "").trim();
    if (q) {
      const rx = new RegExp(escapeRegex(q), "i");
      filter.$or = [
        { plateNo: rx },
        { engineNo: rx },
        { chassisNo: rx },
        { make: rx },
        { model: rx },
        { assignedUnit: rx },
        { currentDriver: rx },
        { registeredOwner: rx },
      ];
    }
    const vehicles = await Vehicle.find(filter).sort({ updatedAt: -1 });
    res.json(vehicles.map((v) => toResponse(req, v)));
  } catch (error) {
    res.status(500).json({ message: "Unable to load vehicles." });
  }
};

exports.getOne = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found." });
    res.json(toResponse(req, vehicle));
  } catch (error) {
    res.status(500).json({ message: "Unable to fetch vehicle." });
  }
};

exports.create = async (req, res) => {
  try {
    const { photoBase64, photoFileName, clearPhoto, photoUrl, ...data } = req.body;
    if (!data.plateNo || !data.plateNo.trim()) {
      return res.status(400).json({ message: "Plate number is required." });
    }
    if (photoBase64) {
      data.photoStoredName = await savePhoto(photoBase64, photoFileName);
    }
    const vehicle = await Vehicle.create(data);
    res.status(201).json({ message: "Vehicle added.", vehicle: toResponse(req, vehicle) });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ message: "Plate number already exists." });
    if (error.status) return res.status(error.status).json({ message: error.message });
    res.status(500).json({ message: "Unable to add vehicle." });
  }
};

exports.update = async (req, res) => {
  try {
    const { photoBase64, photoFileName, clearPhoto, photoUrl, ...data } = req.body;
    const existing = await Vehicle.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: "Vehicle not found." });

    if (photoBase64) {
      const newStored = await savePhoto(photoBase64, photoFileName);
      if (existing.photoStoredName) await deletePhoto(existing.photoStoredName);
      data.photoStoredName = newStored;
    } else if (clearPhoto) {
      if (existing.photoStoredName) await deletePhoto(existing.photoStoredName);
      data.photoStoredName = "";
    }

    const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
    res.json({ message: "Vehicle updated.", vehicle: toResponse(req, vehicle) });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    res.status(500).json({ message: "Unable to update vehicle." });
  }
};

exports.remove = async (req, res) => {
  try {
    const vehicle = await Vehicle.findByIdAndDelete(req.params.id);
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found." });
    if (vehicle.photoStoredName) await deletePhoto(vehicle.photoStoredName);
    res.json({ message: "Vehicle deleted." });
  } catch (error) {
    res.status(500).json({ message: "Unable to delete vehicle." });
  }
};

exports.dispatch = async (req, res) => {
  try {
    const { driver, unit } = req.body;
    const vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      { status: "dispatched", currentDriver: driver || "", assignedUnit: unit || "" },
      { new: true }
    );
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found." });
    res.json({ message: "Vehicle dispatched.", vehicle: toResponse(req, vehicle) });
  } catch (error) {
    res.status(500).json({ message: "Unable to dispatch vehicle." });
  }
};

exports.returnVehicle = async (req, res) => {
  try {
    const { mileage } = req.body;
    const update = { status: "available", currentDriver: "", assignedUnit: "" };
    if (mileage != null) update.mileage = Number(mileage) || 0;
    const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found." });
    res.json({ message: "Vehicle returned.", vehicle: toResponse(req, vehicle) });
  } catch (error) {
    res.status(500).json({ message: "Unable to return vehicle." });
  }
};
