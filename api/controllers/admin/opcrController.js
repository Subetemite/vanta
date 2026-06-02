const Opcr = require("../../models/admin/Opcr");

const STATUS_OPTIONS = Opcr.STATUS_OPTIONS;

function startOfDayUTC(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function attachedFileFromBody(body) {
  if (!body || !body.id) return null;
  return {
    id: body.id,
    originalName: String(body.originalName || "").trim(),
    url: String(body.url || "").trim(),
    mimeType: String(body.mimeType || "").trim(),
    size: Number(body.size) || 0,
  };
}

function clamp01to5(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return 0;
  return Math.min(5, Math.max(0, n));
}

function sanitizeTarget(row = {}) {
  const quality = clamp01to5(row.quality);
  const efficiency = clamp01to5(row.efficiency);
  const timeliness = clamp01to5(row.timeliness);
  const ratings = [quality, efficiency, timeliness].filter((r) => r > 0);
  const averageRating = ratings.length
    ? Number((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2))
    : 0;
  return {
    mfoProgram: String(row.mfoProgram || "").trim(),
    successIndicator: String(row.successIndicator || "").trim(),
    target: String(row.target || "").trim(),
    accomplishment: String(row.accomplishment || "").trim(),
    quality,
    efficiency,
    timeliness,
    averageRating,
    remarks: String(row.remarks || "").trim(),
  };
}

function computeOverall(targets) {
  const rated = targets.filter((t) => t.averageRating > 0);
  if (!rated.length) return 0;
  return Number(
    (rated.reduce((sum, t) => sum + t.averageRating, 0) / rated.length).toFixed(2)
  );
}

function toResponse(opcr) {
  return {
    id: opcr._id,
    office: opcr.office,
    ratingPeriod: opcr.ratingPeriod,
    periodStart: opcr.periodStart,
    periodEnd: opcr.periodEnd,
    status: opcr.status,
    preparedBy: opcr.preparedBy,
    reviewedBy: opcr.reviewedBy,
    approvedBy: opcr.approvedBy,
    approvedAt: opcr.approvedAt,
    targets: opcr.targets,
    overallRating: opcr.overallRating,
    attachedFile: opcr.attachedFile,
    createdAt: opcr.createdAt,
    updatedAt: opcr.updatedAt,
  };
}

exports.getMeta = async (_req, res) => {
  return res.status(200).json({ statusOptions: STATUS_OPTIONS });
};

exports.list = async (req, res) => {
  try {
    const query = String(req.query.q || "").trim();
    const filter = query
      ? {
          $or: [
            { office: { $regex: query, $options: "i" } },
            { ratingPeriod: { $regex: query, $options: "i" } },
          ],
        }
      : {};
    if (req.query.status) filter.status = req.query.status;
    const items = await Opcr.find(filter).sort({ createdAt: -1 }).limit(500);
    return res.status(200).json({ records: items.map(toResponse) });
  } catch (error) {
    return res.status(500).json({ message: "Unable to load OPCR records.", error: error.message });
  }
};

exports.get = async (req, res) => {
  try {
    const opcr = await Opcr.findById(req.params.id);
    if (!opcr) return res.status(404).json({ message: "OPCR not found." });
    return res.status(200).json({ record: toResponse(opcr) });
  } catch (error) {
    return res.status(500).json({ message: "Unable to load OPCR.", error: error.message });
  }
};

function buildFromBody(body) {
  const office = String(body.office || "").trim();
  const ratingPeriod = String(body.ratingPeriod || "").trim();
  if (!office) throw Object.assign(new Error("Office is required."), { status: 400 });
  if (!ratingPeriod) throw Object.assign(new Error("Rating period is required."), { status: 400 });

  const status = STATUS_OPTIONS.includes(body.status) ? body.status : "Draft";
  const targets = Array.isArray(body.targets) ? body.targets.map(sanitizeTarget) : [];

  return {
    office,
    ratingPeriod,
    periodStart: startOfDayUTC(body.periodStart),
    periodEnd: startOfDayUTC(body.periodEnd),
    status,
    preparedBy: String(body.preparedBy || "").trim(),
    reviewedBy: String(body.reviewedBy || "").trim(),
    approvedBy: String(body.approvedBy || "").trim(),
    approvedAt: status === "Approved" ? new Date() : null,
    targets,
    overallRating: computeOverall(targets),
    attachedFile: attachedFileFromBody(body.attachedFile) || undefined,
  };
}

exports.create = async (req, res) => {
  try {
    const fields = buildFromBody(req.body);
    const opcr = await Opcr.create(fields);
    return res.status(201).json({ message: "OPCR created.", record: toResponse(opcr) });
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const opcr = await Opcr.findById(req.params.id);
    if (!opcr) return res.status(404).json({ message: "OPCR not found." });
    const fields = buildFromBody(req.body);
    Object.assign(opcr, fields);
    if (req.body.attachedFile === null) opcr.attachedFile = undefined;
    if (req.body.status !== "Approved") opcr.approvedAt = null;
    await opcr.save();
    return res.status(200).json({ message: "OPCR updated.", record: toResponse(opcr) });
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const removed = await Opcr.findByIdAndDelete(req.params.id);
    if (!removed) return res.status(404).json({ message: "OPCR not found." });
    return res.status(200).json({ message: "OPCR deleted." });
  } catch (error) {
    return res.status(500).json({ message: "Unable to delete OPCR.", error: error.message });
  }
};
