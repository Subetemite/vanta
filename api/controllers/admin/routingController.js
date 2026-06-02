const RoutingRecord = require("../../models/admin/RoutingRecord");
const User = require("../../models/User");
const { createForUsers } = require("../notificationController");

const ACTION_OPTIONS = RoutingRecord.ACTION_OPTIONS;
const CATEGORIES = RoutingRecord.CATEGORIES;

function sanitizeCategory(value) {
  const v = String(value || "").trim().toLowerCase();
  return CATEGORIES.includes(v) ? v : "incoming";
}

function deriveEncoderCode(user) {
  if (user?.employee?.employeeId) return user.employee.employeeId;
  if (user?.username) return user.username.toUpperCase();
  return "";
}

async function loadActor(req) {
  return User.findById(req.user?.sub).select(
    "_id username email role moduleRoles modulePermissions employee"
  );
}

function isModuleAdmin(actor) {
  if (!actor) return false;
  if (actor.role === "admin") return true;
  return Boolean(
    actor.modulePermissions?.admin && actor.moduleRoles?.admin === "admin"
  );
}

function isTaggedInRecord(actor, record) {
  const empId = actor?.employee?.employeeId;
  if (!empId || !record?.lines) return false;
  return record.lines.some(
    (l) => l.toEmployeeId === empId || l.fromEmployeeId === empId
  );
}

function deriveAuthorName(user) {
  const parts = [user?.employee?.firstName, user?.employee?.lastName].filter(Boolean).join(" ").trim();
  return parts || user?.username || user?.email || "Unknown";
}

function sanitizeLine(line = {}) {
  const raw = Array.isArray(line.actionRequested)
    ? line.actionRequested
    : line.actionRequested
    ? [line.actionRequested]
    : [];
  const seen = new Set();
  const actions = ACTION_OPTIONS.filter((opt) => {
    if (!raw.includes(opt) || seen.has(opt)) return false;
    seen.add(opt);
    return true;
  });
  return {
    from: String(line.from || "").trim(),
    fromEmployeeId: String(line.fromEmployeeId || "").trim(),
    to: String(line.to || "").trim(),
    toEmployeeId: String(line.toEmployeeId || "").trim(),
    actionRequested: actions,
    date: line.date ? new Date(line.date) : null,
    senderName: String(line.senderName || "").trim(),
    additionalRemarks: String(line.additionalRemarks || "").trim(),
  };
}

function toResponse(record) {
  return {
    id: record._id,
    controlNumber: record.controlNumber,
    category: record.category || "incoming",
    subject: record.subject,
    encoder: record.encoder,
    lines: record.lines,
    comments: Array.isArray(record.comments)
      ? record.comments.map((c) => ({
          author: c.author,
          authorId: c.authorId,
          text: c.text,
          createdAt: c.createdAt,
        }))
      : [],
    attachedFile: record.attachedFile,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

async function notifyRecipients({ record, recipientEmployeeIds, actorUserId }) {
  const ids = Array.from(new Set(recipientEmployeeIds.filter(Boolean)));
  if (!ids.length) return;
  const users = await User.find({ "employee.employeeId": { $in: ids } }).select("_id");
  const userIds = users.map((u) => u._id).filter((id) => String(id) !== String(actorUserId));
  if (!userIds.length) return;
  await createForUsers(userIds, {
    type: "routing.assigned",
    title: `Routing slip assigned: ${record.controlNumber}`,
    message: `You were tagged as recipient on "${record.subject}".`,
    link: `/admin/documents/${record._id}`,
    meta: { recordId: record._id, controlNumber: record.controlNumber },
  });
}

async function notifyComment({ record, commentAuthor, actorUserId }) {
  const recipientEmployeeIds = Array.from(
    new Set(
      (record.lines || [])
        .map((l) => l.toEmployeeId)
        .filter(Boolean)
    )
  );
  if (!recipientEmployeeIds.length) return;
  const users = await User.find({ "employee.employeeId": { $in: recipientEmployeeIds } }).select("_id");
  const userIds = users.map((u) => u._id).filter((id) => String(id) !== String(actorUserId));
  if (!userIds.length) return;
  await createForUsers(userIds, {
    type: "routing.commented",
    title: `New comment on ${record.controlNumber}`,
    message: `${commentAuthor} commented on "${record.subject}".`,
    link: `/admin/documents/${record._id}`,
    meta: { recordId: record._id, controlNumber: record.controlNumber },
  });
}

exports.listRecords = async (req, res) => {
  try {
    const actor = await loadActor(req);
    if (!actor) return res.status(401).json({ message: "User not found." });

    const query = String(req.query.q || "").trim();
    const categoryFilterRaw = String(req.query.category || "").trim().toLowerCase();
    const categoryFilter = CATEGORIES.includes(categoryFilterRaw) ? categoryFilterRaw : null;

    const clauses = [];
    if (query) {
      clauses.push({
        $or: [
          { controlNumber: { $regex: query, $options: "i" } },
          { subject: { $regex: query, $options: "i" } },
          { "encoder.code": { $regex: query, $options: "i" } },
          { "encoder.username": { $regex: query, $options: "i" } },
        ],
      });
    }
    if (categoryFilter === "incoming") {
      // Treat legacy records (no category set) as incoming.
      clauses.push({
        $or: [{ category: "incoming" }, { category: { $in: [null, undefined] } }],
      });
    } else if (categoryFilter === "outgoing") {
      clauses.push({ category: "outgoing" });
    }

    if (!isModuleAdmin(actor)) {
      const empId = actor.employee?.employeeId;
      if (!empId) {
        return res.status(200).json({ query, records: [], counts: { incoming: 0, outgoing: 0 } });
      }
      clauses.push({
        $or: [
          { "lines.toEmployeeId": empId },
          { "lines.fromEmployeeId": empId },
        ],
      });
    }

    const mongoFilter = clauses.length === 0 ? {} : clauses.length === 1 ? clauses[0] : { $and: clauses };

    const records = await RoutingRecord.find(mongoFilter)
      .sort({ createdAt: -1 })
      .limit(200);

    // Counts ignore the category filter so tabs always show both totals,
    // but still respect q/visibility constraints.
    const countClauses = clauses.filter((c) => {
      if ("category" in c) return false;
      // Drop the category-tolerant $or clause we may have pushed above.
      if (Array.isArray(c.$or) && c.$or.some((sub) => "category" in sub)) return false;
      return true;
    });
    const countFilter = countClauses.length === 0 ? {} : countClauses.length === 1 ? countClauses[0] : { $and: countClauses };
    const grouped = await RoutingRecord.aggregate([
      { $match: countFilter },
      { $group: { _id: "$category", n: { $sum: 1 } } },
    ]);
    const counts = { incoming: 0, outgoing: 0 };
    for (const row of grouped) {
      // Legacy/null categories roll up into "incoming".
      const k = row._id === "outgoing" ? "outgoing" : "incoming";
      counts[k] += row.n;
    }

    return res.status(200).json({
      query,
      category: categoryFilter,
      counts,
      records: records.map(toResponse),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to load routing records.",
      error: error.message,
    });
  }
};

exports.getRecord = async (req, res) => {
  try {
    const record = await RoutingRecord.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ message: "Record not found." });
    }
    const actor = await loadActor(req);
    if (!actor) return res.status(401).json({ message: "User not found." });
    if (!isModuleAdmin(actor) && !isTaggedInRecord(actor, record)) {
      return res.status(403).json({ message: "You are not assigned to this record." });
    }
    return res.status(200).json({ record: toResponse(record) });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to load record.",
      error: error.message,
    });
  }
};

exports.createRecord = async (req, res) => {
  try {
    const actor = await loadActor(req);
    if (!actor) return res.status(401).json({ message: "User not found." });
    if (!isModuleAdmin(actor)) {
      return res.status(403).json({
        message: "Only admin users in the Admin module can create routing records.",
      });
    }

    const { controlNumber, category, subject, lines, comment, attachedFile } = req.body;

    const trimmedControlNumber = String(controlNumber || "").trim();
    if (!trimmedControlNumber) {
      return res.status(400).json({ message: "PAOCC Control No is required." });
    }

    if (!subject || !String(subject).trim()) {
      return res.status(400).json({ message: "Subject is required." });
    }

    if (!Array.isArray(lines) || lines.length < 1) {
      return res.status(400).json({ message: "At least one routing line is required." });
    }

    if (lines.length > 5) {
      return res.status(400).json({ message: "A record cannot have more than 5 lines." });
    }

    const existing = await RoutingRecord.findOne({ controlNumber: trimmedControlNumber }).select("_id");
    if (existing) {
      return res.status(409).json({
        message: `PAOCC Control No "${trimmedControlNumber}" already exists.`,
      });
    }

    const sanitizedCategory = sanitizeCategory(category);
    const sanitizedLines = lines.map(sanitizeLine);

    for (const [index, line] of sanitizedLines.entries()) {
      if (!line.from || !line.to || !line.date || !line.senderName) {
        return res.status(400).json({
          message: `Line ${index + 1}: from, to, date, and sender's name are required.`,
        });
      }
      if (!line.actionRequested.length) {
        return res.status(400).json({
          message: `Line ${index + 1}: at least one Action Requested must be selected.`,
        });
      }
    }

    const initialComments = [];
    if (comment && String(comment).trim()) {
      initialComments.push({
        author: deriveAuthorName(actor),
        authorId: actor._id,
        text: String(comment).trim(),
        createdAt: new Date(),
      });
    }

    const record = await RoutingRecord.create({
      controlNumber: trimmedControlNumber,
      category: sanitizedCategory,
      subject: String(subject).trim(),
      encoder: {
        id: actor._id,
        code: deriveEncoderCode(actor),
        username: actor.username,
        email: actor.email,
      },
      lines: sanitizedLines,
      comments: initialComments,
      attachedFile: attachedFile && attachedFile.id
        ? {
            id: attachedFile.id,
            originalName: String(attachedFile.originalName || "").trim(),
            url: String(attachedFile.url || "").trim(),
            mimeType: String(attachedFile.mimeType || "").trim(),
            size: Number(attachedFile.size) || 0,
          }
        : undefined,
    });

    const recipientEmployeeIds = sanitizedLines.map((l) => l.toEmployeeId).filter(Boolean);
    notifyRecipients({ record, recipientEmployeeIds, actorUserId: actor._id }).catch(() => {});

    return res.status(201).json({
      message: "Record created successfully.",
      record: toResponse(record),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to create record.",
      error: error.message,
    });
  }
};

exports.updateRecord = async (req, res) => {
  try {
    const record = await RoutingRecord.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ message: "Record not found." });
    }
    const actor = await loadActor(req);
    if (!actor) return res.status(401).json({ message: "User not found." });
    if (!isModuleAdmin(actor) && !isTaggedInRecord(actor, record)) {
      return res.status(403).json({
        message: "You can only update records you are tagged on.",
      });
    }

    const { controlNumber, category, subject, lines, comment, attachedFile } = req.body;

    const trimmedControlNumber = String(controlNumber || "").trim();
    if (!trimmedControlNumber) {
      return res.status(400).json({ message: "PAOCC Control No is required." });
    }

    if (!subject || !String(subject).trim()) {
      return res.status(400).json({ message: "Subject is required." });
    }

    if (!Array.isArray(lines) || lines.length < 1) {
      return res.status(400).json({ message: "At least one routing line is required." });
    }

    if (lines.length > 5) {
      return res.status(400).json({ message: "A record cannot have more than 5 lines." });
    }

    if (trimmedControlNumber !== record.controlNumber) {
      const clash = await RoutingRecord.findOne({
        controlNumber: trimmedControlNumber,
        _id: { $ne: record._id },
      }).select("_id");
      if (clash) {
        return res.status(409).json({
          message: `PAOCC Control No "${trimmedControlNumber}" already exists.`,
        });
      }
    }

    const sanitizedLines = lines.map(sanitizeLine);

    for (const [index, line] of sanitizedLines.entries()) {
      if (!line.from || !line.to || !line.date || !line.senderName) {
        return res.status(400).json({
          message: `Line ${index + 1}: from, to, date, and sender's name are required.`,
        });
      }
      if (!line.actionRequested.length) {
        return res.status(400).json({
          message: `Line ${index + 1}: at least one Action Requested must be selected.`,
        });
      }
    }

    const previousRecipientIds = new Set(
      (record.lines || []).map((l) => l.toEmployeeId).filter(Boolean)
    );
    const newRecipientIds = sanitizedLines
      .map((l) => l.toEmployeeId)
      .filter((id) => id && !previousRecipientIds.has(id));

    record.controlNumber = trimmedControlNumber;
    if (category !== undefined) {
      record.category = sanitizeCategory(category);
    }
    record.subject = String(subject).trim();
    record.lines = sanitizedLines;

    let appendedComment = null;
    if (comment && String(comment).trim()) {
      appendedComment = {
        author: deriveAuthorName(actor),
        authorId: actor._id,
        text: String(comment).trim(),
        createdAt: new Date(),
      };
      record.comments.push(appendedComment);
    }

    if (attachedFile && attachedFile.id) {
      record.attachedFile = {
        id: attachedFile.id,
        originalName: String(attachedFile.originalName || "").trim(),
        url: String(attachedFile.url || "").trim(),
        mimeType: String(attachedFile.mimeType || "").trim(),
        size: Number(attachedFile.size) || 0,
      };
    } else if (attachedFile === null) {
      record.attachedFile = undefined;
    }

    await record.save();

    if (newRecipientIds.length) {
      notifyRecipients({ record, recipientEmployeeIds: newRecipientIds, actorUserId: req.user.sub }).catch(() => {});
    }
    if (appendedComment) {
      notifyComment({ record, commentAuthor: appendedComment.author, actorUserId: req.user.sub }).catch(() => {});
    }

    return res.status(200).json({
      message: "Record updated successfully.",
      record: toResponse(record),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to update record.",
      error: error.message,
    });
  }
};

exports.addComment = async (req, res) => {
  try {
    const record = await RoutingRecord.findById(req.params.id);
    if (!record) return res.status(404).json({ message: "Record not found." });

    const text = String(req.body?.text || "").trim();
    if (!text) return res.status(400).json({ message: "Comment text is required." });

    const actor = await loadActor(req);
    if (!actor) return res.status(401).json({ message: "User not found." });
    if (!isModuleAdmin(actor) && !isTaggedInRecord(actor, record)) {
      return res.status(403).json({ message: "You can only comment on records you are tagged on." });
    }

    const newComment = {
      author: deriveAuthorName(actor),
      authorId: actor._id,
      text,
      createdAt: new Date(),
    };
    record.comments.push(newComment);
    await record.save();

    notifyComment({ record, commentAuthor: newComment.author, actorUserId: actor._id }).catch(() => {});

    return res.status(201).json({
      message: "Comment added.",
      record: toResponse(record),
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to add comment.", error: error.message });
  }
};

exports.deleteRecord = async (req, res) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ message: "Administrator access is required." });
    }
    const removed = await RoutingRecord.findByIdAndDelete(req.params.id);
    if (!removed) {
      return res.status(404).json({ message: "Record not found." });
    }
    return res.status(200).json({ message: "Record deleted." });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to delete record.",
      error: error.message,
    });
  }
};

exports.getMeta = async (_req, res) => {
  return res.status(200).json({ actionOptions: ACTION_OPTIONS, categories: CATEGORIES });
};
